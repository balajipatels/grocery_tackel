import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function generateStaffId(): Promise<string> {
  const lastStaff = await prisma.user.findFirst({
    where: { staffId: { not: null } },
    orderBy: { staffId: "desc" },
    select: { staffId: true },
  })

  if (!lastStaff?.staffId) return "STF-001"
  const lastNumber = parseInt(lastStaff.staffId.split("-")[1])
  return `STF-${String(lastNumber + 1).padStart(3, "0")}`
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, action } = await req.json()
    if (!id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (action === "approve") {
      const staffId = await generateStaffId()
      const user = await prisma.user.update({
        where: { id },
        data: { status: "APPROVED", staffId },
      })
      return NextResponse.json({ user, action: "approve" })
    } else {
      const user = await prisma.user.update({
        where: { id },
        data: { status: "REJECTED" },
      })
      return NextResponse.json({ user, action: "reject" })
    }
  } catch (error) {
    console.error("[API] User approval error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
