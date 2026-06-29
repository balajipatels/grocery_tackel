import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { nickname } = await req.json()
    if (!nickname) return NextResponse.json({ error: "Invalid" }, { status: 400 })

    const user = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { nickname: nickname.trim() },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
