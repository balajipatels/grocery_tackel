import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const SAMPLES = [
  { name: "Toor Dal", cat: "Grocery & Staples", buy: 95, sell: 110, mrp: 120, unit: "kg", qty: 10 },
  { name: "Rice", cat: "Grocery & Staples", buy: 75, sell: 85, mrp: 95, unit: "kg", qty: 10 },
  { name: "Biscuits", cat: "Snacks & Beverages", buy: 5, sell: 6, mrp: 7, unit: "pcs", qty: 20 },
  { name: "Milk", cat: "Dairy", buy: 26, sell: 30, mrp: 30, unit: "pcs", qty: 15 },
  { name: "Tea", cat: "Tea Corner", buy: 5, sell: 10, mrp: 10, unit: "pcs", qty: 50 },
]

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const cats = await prisma.category.findMany()
    const catMap = new Map(cats.map(c => [c.name, c.id]))
    let created = 0

    for (const s of SAMPLES) {
      const catId = catMap.get(s.cat)
      if (!catId) continue
      const exists = await prisma.product.findFirst({ where: { name: s.name, categoryId: catId } })
      if (!exists) {
        await prisma.product.create({
          data: { name: s.name, categoryId: catId, buyingPrice: s.buy, sellingPrice: s.sell, 
            mrp: s.mrp, unit: s.unit, stockQty: s.qty, isSample: true, reorderLevel: 5 }
        })
        created++
      }
    }
    return NextResponse.json({ success: true, created })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const result = await prisma.product.deleteMany({ where: { isSample: true } })
    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
