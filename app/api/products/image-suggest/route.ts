import { NextRequest, NextResponse } from "next/server"

const PRODUCT_IMAGES: Record<string, string> = {
  "dal": "https://images.unsplash.com/photo-1596560548018-4c5c5f71d861?w=400",
  "rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
  "wheat": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400",
  "sugar": "https://images.unsplash.com/photo-1582049369194-23569abfcf1c?w=400",
  "oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
  "milk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
  "butter": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400",
  "bread": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
  "biscuit": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
  "chips": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400",
  "tea": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400",
  "soap": "https://images.unsplash.com/photo-1585128719200-fbb8785dbed8?w=400",
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productName = searchParams.get("name")

    if (!productName || productName.trim().length < 2) {
      return NextResponse.json({ error: "Product name required" }, { status: 400 })
    }

    const normalized = productName.toLowerCase().trim()
    
    for (const [key, url] of Object.entries(PRODUCT_IMAGES)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return NextResponse.json({ imageUrl: url, confidence: "high" })
      }
    }

    const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&size=400&background=1B4332&color=fff`
    return NextResponse.json({ imageUrl: placeholder, confidence: "low" })
  } catch (error) {
    console.error("[API] Image suggest error:", error)
    return NextResponse.json({ error: "Failed to suggest image" }, { status: 500 })
  }
}
