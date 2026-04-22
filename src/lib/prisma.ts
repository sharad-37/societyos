// src/lib/prisma.ts
// ============================================================
// PRISMA CLIENT SINGLETON
// Prevents multiple DB connections during development
// ============================================================

import { PrismaClient } from "@prisma/client";

// Extend global type to include prisma
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create client with logging in development
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

// Use existing connection in development (hot reload safe)
// Create new connection in production
const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;

// Usage in any API route:
// import prisma from '@/lib/prisma'
// const users = await prisma.user.findMany()
