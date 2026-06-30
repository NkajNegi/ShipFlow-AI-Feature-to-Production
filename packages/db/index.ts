import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Re-export the concrete runtime values explicitly (Prisma is CommonJS, so a
// bare `export *` makes Turbopack emit a runtime-resolved re-export that can
// break the production server bundle). Types are re-exported separately and
// erased at compile time.
export { Prisma, PrismaClient } from "@prisma/client";
export type * from "@prisma/client";
