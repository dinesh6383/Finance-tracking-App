import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

const checkUser = async () => {
  const user = await currentUser();

  // If user not found return null
  if (!user) return null;

  // Working in supabase DB.
  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    // If user found return it.
    if (loggedInUser) return loggedInUser;

    const username = `${user.firstName} ${user.lastName}`;
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name: username,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser;
  } catch (error) {
    console.log(error.message);
  }
};

export default checkUser;
