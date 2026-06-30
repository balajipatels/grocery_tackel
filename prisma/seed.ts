import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log("🌱 Seeding database...")

  // Categories
  await prisma.category.createMany({
    data: [
      { name: "Grocery & Staples", cgstPercent: 0, sgstPercent: 0, colorHex: "#1B4332", isQuickService: false },
      { name: "Snacks & Beverages", cgstPercent: 9, sgstPercent: 9, colorHex: "#BA7517", isQuickService: false },
      { name: "Personal Care", cgstPercent: 9, sgstPercent: 9, colorHex: "#993556", isQuickService: false },
      { name: "Tea Corner", cgstPercent: 2.5, sgstPercent: 2.5, colorHex: "#378ADD", isQuickService: true },
      { name: "Dairy", cgstPercent: 0, sgstPercent: 0, colorHex: "#534AB7", isQuickService: false },
    ],
    skipDuplicates: true,
  })

  console.log("✅ Categories created")

  console.log("🎉 Seed complete!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
