import { PrismaClient } from "@prisma/client";

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

/* ! NOTE - FOR ABOVE CODE !
    globalThis.prisma : This variable ensures that the prisma client instance is reused across hot reloads during dev,
    without this, each time your application reloads a new instance is created which potentially leads to connectivity issue.
*/
