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
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Grocery & Staples" },
      update: {},
      create: { name: "Grocery & Staples", cgstPercent: 0, sgstPercent: 0, colorHex: "#1B4332", isQuickService: false },
    }),
    prisma.category.upsert({
      where: { name: "Snacks & Beverages" },
      update: {},
      create: { name: "Snacks & Beverages", cgstPercent: 9, sgstPercent: 9, colorHex: "#BA7517", isQuickService: false },
    }),
    prisma.category.upsert({
      where: { name: "Personal Care" },
      update: {},
      create: { name: "Personal Care", cgstPercent: 9, sgstPercent: 9, colorHex: "#993556", isQuickService: false },
    }),
    prisma.category.upsert({
      where: { name: "Tea Corner" },
      update: {},
      create: { name: "Tea Corner", cgstPercent: 2.5, sgstPercent: 2.5, colorHex: "#378ADD", isQuickService: true },
    }),
    prisma.category.upsert({
      where: { name: "Dairy" },
      update: {},
      create: { name: "Dairy", cgstPercent: 0, sgstPercent: 0, colorHex: "#534AB7", isQuickService: false },
    }),
  ])

  const [grocery, snacks, care, tea, dairy] = categories
  console.log("✅ Categories created")

  // Products
  const products = [
    // Grocery
    { name: "Toor Dal", categoryId: grocery.id, buyingPrice: 95, sellingPrice: 110, mrp: 120, stockQty: 50, unit: "kg", reorderLevel: 10, sku: "GRO-001" },
    { name: "Basmati Rice", categoryId: grocery.id, buyingPrice: 75, sellingPrice: 85, mrp: 95, stockQty: 100, unit: "kg", reorderLevel: 20, sku: "GRO-002" },
    { name: "Wheat Flour", categoryId: grocery.id, buyingPrice: 35, sellingPrice: 42, mrp: 48, stockQty: 80, unit: "kg", reorderLevel: 20, sku: "GRO-003" },
    { name: "Sugar", categoryId: grocery.id, buyingPrice: 38, sellingPrice: 44, mrp: 50, stockQty: 60, unit: "kg", reorderLevel: 15, sku: "GRO-004" },
    { name: "Refined Oil", categoryId: grocery.id, buyingPrice: 130, sellingPrice: 150, mrp: 165, stockQty: 40, unit: "ltr", reorderLevel: 10, sku: "GRO-005" },
    { name: "Salt", categoryId: grocery.id, buyingPrice: 18, sellingPrice: 22, mrp: 25, stockQty: 30, unit: "kg", reorderLevel: 5, sku: "GRO-006" },
    { name: "Turmeric Powder", categoryId: grocery.id, buyingPrice: 120, sellingPrice: 145, mrp: 160, stockQty: 20, unit: "kg", reorderLevel: 5, sku: "GRO-007" },
    { name: "Red Chilli Powder", categoryId: grocery.id, buyingPrice: 150, sellingPrice: 175, mrp: 190, stockQty: 15, unit: "kg", reorderLevel: 5, sku: "GRO-008" },
    // Snacks
    { name: "Parle-G Biscuits", categoryId: snacks.id, buyingPrice: 5, sellingPrice: 6, mrp: 7, stockQty: 100, unit: "pcs", reorderLevel: 30, sku: "SNK-001" },
    { name: "Lays Chips", categoryId: snacks.id, buyingPrice: 18, sellingPrice: 20, mrp: 20, stockQty: 50, unit: "pcs", reorderLevel: 20, sku: "SNK-002" },
    { name: "Thums Up", categoryId: snacks.id, buyingPrice: 40, sellingPrice: 45, mrp: 50, stockQty: 48, unit: "pcs", reorderLevel: 12, sku: "SNK-003" },
    // Personal Care
    { name: "Colgate Toothpaste", categoryId: care.id, buyingPrice: 65, sellingPrice: 75, mrp: 82, stockQty: 25, unit: "pcs", reorderLevel: 8, sku: "CAR-001" },
    { name: "Lifebuoy Soap", categoryId: care.id, buyingPrice: 28, sellingPrice: 33, mrp: 38, stockQty: 40, unit: "pcs", reorderLevel: 10, sku: "CAR-002" },
    // Tea Corner
    { name: "Cutting Chai (Glass)", categoryId: tea.id, buyingPrice: 5, sellingPrice: 10, mrp: 10, stockQty: 999, unit: "pcs", reorderLevel: 100, sku: "TEA-001" },
    { name: "Tea with Bun", categoryId: tea.id, buyingPrice: 10, sellingPrice: 18, mrp: 18, stockQty: 999, unit: "pcs", reorderLevel: 50, sku: "TEA-002" },
    { name: "Vada Pav", categoryId: tea.id, buyingPrice: 12, sellingPrice: 20, mrp: 20, stockQty: 999, unit: "pcs", reorderLevel: 30, sku: "TEA-003" },
    // Dairy
    { name: "Amul Milk (500ml)", categoryId: dairy.id, buyingPrice: 26, sellingPrice: 30, mrp: 30, stockQty: 60, unit: "pcs", reorderLevel: 20, sku: "DAI-001" },
    { name: "Amul Butter", categoryId: dairy.id, buyingPrice: 52, sellingPrice: 60, mrp: 65, stockQty: 20, unit: "pcs", reorderLevel: 5, sku: "DAI-002" },
    { name: "Paneer (200g)", categoryId: dairy.id, buyingPrice: 72, sellingPrice: 85, mrp: 90, stockQty: 15, unit: "pcs", reorderLevel: 5, sku: "DAI-003" },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    })
  }
  console.log("✅ Products created:", products.length)

  // Sample expenses
  const now = new Date()
  const expenseData: Array<{ category: "RENT" | "UTILITIES" | "SALARIES" | "ADVANCE" | "MAINTENANCE" | "OTHER"; amount: number; description: string; date: Date }> = [
    { category: "RENT", amount: 15000, description: "Monthly shop rent", date: new Date(now.getFullYear(), now.getMonth(), 1) },
    { category: "UTILITIES", amount: 2500, description: "Electricity bill", date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { category: "SALARIES", amount: 12000, description: "Staff salary", date: new Date(now.getFullYear(), now.getMonth(), 1) },
  ]

  for (const e of expenseData) {
    await prisma.expense.create({ data: e })
  }
  console.log("✅ Sample expenses created")

  console.log("🎉 Seed complete!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
