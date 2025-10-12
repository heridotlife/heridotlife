// NOTE: This file is not currently used in the project
// The project uses Cloudflare D1 database instead of Prisma
// Keeping this for potential future use

/*
import PrismaClientPkg from '@prisma/client';

const { PrismaClient } = PrismaClientPkg;
type PrismaClientType = InstanceType<typeof PrismaClient>;

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

let prisma: PrismaClientType;

if (import.meta.env.PROD) {
  prisma = new PrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;
*/

export default {};
