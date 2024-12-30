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

export const createAccount = async (data) => {
  try {
    const { userId } = await auth();

    // If user not authorized.
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If user not found in database.
    if (!user) throw new Error("User not found");

    // If user is found. Convert the balance amount from int to float.
    const balanceFloat = parseFloat(data.balance);

    // If the amount is not a number throw error
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check for the first account
    const existingAccount = await db.account.findMany({
      where: { userId: user.id, isDefault: true },
    });

    const shouldBeDefault = existingAccount.length == 0 ? true : data.isDefault;

    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });

      const newAccount = await db.account.create({
        data: {
          ...data,
          balance: balanceFloat,
          userId: user.id,
          isDefault: shouldBeDefault,
        },
      });

      const serializeAccount = serialize(newAccount);
      revalidatePath("/dashboard");
      return { success: true, data: serializeAccount };
    }
  } catch (error) {
    console.log(error);
  }
};

export const getUserAccounts = async () => {
  try {
    const { userId } = await auth();

    // If user not authorized.
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    // If user not found in database.
    if (!user) throw new Error("User not found");

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const serializedAccounts = accounts.map((acc) => serialize(acc));

    return { success: true, data: serializedAccounts };
  } catch (error) {
    console.log(error);
  }
};

export const getDashBoardData = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serialize);
};
