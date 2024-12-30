"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serialize = (data) => {
  const serializedData = { ...data };

  if (data.balance) {
    serializedData.balance = data.balance.toNumber();
  }

  if (data.amount) {
    serializedData.amount = data.amount.toNumber();
  }

  return serializedData;
};

export const updateDefaultAccount = async (accountId) => {
  try {
    const { userId } = await auth();

    // If user not authorized.
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If user not found in database.
    if (!user) throw new Error("User not found");

    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const updatedAccount = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    const serializeAccount = serialize(updatedAccount);
    revalidatePath("/dashboard");
    return { success: true, data: serializeAccount };
  } catch (error) {
    console.log(error);
  }
};

export const getAccountTransactions = async (accountId) => {
  try {
    const { userId } = await auth();

    // If user not authorized.
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If user not found in database.
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: {
        id: accountId,
        userId: user.id,
      },
      include: {
        transactions: {
          orderBy: { date: "desc" },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) return;

    return {
      ...serialize(account),
      transactions: account.transactions.map(serialize),
    };
  } catch (error) {
    console.log(error);
  }
};

export const bulkDeleteTransactions = async (transactionIds) => {
  try {
    const { userId } = await auth();

    // If user not authorized.
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If user not found in database.
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    const accountBalanceChanges = transactions.reduce((acc, curr) => {
      const change = curr.type === "EXPENSE" ? curr.amount : -curr.amount;

      acc[curr.accountId] = (acc[curr.accountId] || 0) + change;
      return acc;
    }, {});

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard", "page");
    revalidatePath("/account/[id]", "page");

    return { success: true };
  } catch (error) {
    console.log(error.message);
    return { success: false, message: error.message };
  }
};
