import { NextResponse } from "next/server"

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0]
    const cacheKey = `daily-quote-${today}`

    // Try Redis cache
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import("@upstash/redis")
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      const cached = await redis.get(cacheKey)
      if (cached) return NextResponse.json(cached)

      if (process.env.ANTHROPIC_API_KEY) {
        const Anthropic = (await import("@anthropic-ai/sdk")).default
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        const message = await client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: `Give me one short, powerful quote about business growth, retail success, or entrepreneurship. 
Return ONLY valid JSON, no other text: {"quote": "the quote here", "author": "Author Name"}
Make the quote inspiring and relevant to a retail shop owner in India.`,
            },
          ],
        })
        const text = message.content[0].type === "text" ? message.content[0].text : ""
        const data = JSON.parse(text)
        await redis.setex(cacheKey, 86400, JSON.stringify(data))
        return NextResponse.json(data)
      }
    }

    // Fallback quotes when AI/Redis not configured
    const fallbacks = [
      { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { quote: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
      { quote: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
      { quote: "The customer is always right — and always comes first.", author: "Harry Gordon Selfridge" },
    ]
    const quote = fallbacks[new Date().getDay() % fallbacks.length]
    return NextResponse.json(quote)
  } catch (error) {
    console.error("AI quote error:", error)
    return NextResponse.json(
      { quote: "Every day is a new opportunity to grow your business.", author: "GroceryOS" },
      { status: 200 }
    )
  }
}
