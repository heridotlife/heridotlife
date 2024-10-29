import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Extend the NodeJS.Global interface to include the prisma property
  interface CustomNodeJsGlobal extends NodeJS.Global {
    prisma: PrismaClient;
  }

  const globalForPrisma = global as CustomNodeJsGlobal;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

// Declare the global prisma variable
declare global {
  const prisma: PrismaClient | undefined;
}

export default prisma;
