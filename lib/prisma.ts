import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter } as any)
}

// Lazy proxy — defers PrismaClient instantiation to first property access.
// This prevents the constructor from running in the Edge runtime during
// module evaluation (it only runs in Node.js API routes that actually call it).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop: PropertyKey) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createClient()
    }
    const value = (globalForPrisma.prisma as any)[prop as string]
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value
  },
})
