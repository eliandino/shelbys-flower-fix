import { PrismaClient } from "@prisma/client";

// One shared client for the whole app, per Prisma's recommended pattern.
export const prisma = new PrismaClient();
