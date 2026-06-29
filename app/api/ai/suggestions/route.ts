import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0]
    const cacheKey = `ai-suggestions-${today}`

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import("@upstash/redis")
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached)

      if (process.env.ANTHROPIC_API_KEY) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const [topProducts, lowStockProducts, expenses] = await Promise.all([
          prisma.billItem.groupBy({
            by: ["productName"],
            where: { bill: { createdAt: { gte: thirtyDaysAgo } } },
            _sum: { quantity: true, lineTotal: true },
            orderBy: { _sum: { lineTotal: "desc" } },
            take: 10,
          }),
          prisma.product.findMany({
            where: { isActive: true, stockQty: { lte: 10 } },
            orderBy: { stockQty: "asc" },
            take: 10,
            include: { category: true },
          }),
          prisma.expense.aggregate({
            where: { date: { gte: thirtyDaysAgo } },
            _sum: { amount: true },
          }),
        ])

        const dataContext = JSON.stringify({ topProducts, lowStockProducts, expenses })

        const Anthropic = (await import("@anthropic-ai/sdk")).default
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const message = await client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a retail business advisor for a grocery shop in India. 
Based on this sales data: ${dataContext}

Give exactly 5 specific, actionable suggestions to improve profitability.
Return ONLY valid JSON array, no other text:
[
  {"type": "growth", "title": "Short title", "description": "Specific action to take"},
  {"type": "warning", "title": "Short title", "description": "Issue to address"},
  {"type": "tip", "title": "Short title", "description": "Quick improvement tip"}
]
type must be one of: "growth" | "warning" | "tip" | "stock"`,
            },
          ],
        })
        const text = message.content[0].type === "text" ? message.content[0].text : "[]"
        const suggestions = JSON.parse(text)
        await redis.setex(cacheKey, 86400, JSON.stringify(suggestions))
        return NextResponse.json(suggestions)
      }
    }

    // Fallback suggestions
    return NextResponse.json([
      { type: "growth", title: "Bundle Popular Items", description: "Create combo offers for top-selling products to increase average bill value." },
      { type: "stock", title: "Review Low Stock", description: "Check inventory levels and reorder items before running out." },
      { type: "tip", title: "Track Daily Revenue", description: "Monitor daily sales trends to identify peak hours and slow periods." },
      { type: "warning", title: "Expiry Management", description: "Check products nearing expiry and offer discounts to move them quickly." },
      { type: "growth", title: "Upsell Tea & Snacks", description: "Promote quick service items at checkout to boost margins." },
    ])
  } catch (error) {
    console.error("AI suggestions error:", error)
    return NextResponse.json([])
  }
}
