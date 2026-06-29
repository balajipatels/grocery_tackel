import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true, role: true, status: true, staffId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, role } = await req.json()
    if (!id || !role) return NextResponse.json({ error: "id and role required" }, { status: 400 })
    const user = await prisma.user.update({ where: { id }, data: { role } })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
