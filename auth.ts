import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"

function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || ""
  return adminEmails.split(",").map(email => email.trim()).filter(Boolean)
}

function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}

async function verifyFirebaseToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    console.error("[Auth] NEXT_PUBLIC_FIREBASE_API_KEY is not set in .env.local")
    return null
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error("[Auth] Firebase REST API error:", res.status, JSON.stringify(err))
    return null
  }

  const data = await res.json()
  if (!data.users?.[0]) {
    console.error("[Auth] No user returned from Firebase:", JSON.stringify(data))
    return null
  }
  return data.users[0]
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const { firebaseToken } = credentials as { firebaseToken: string }
          if (!firebaseToken) return null

          const fbUser = await verifyFirebaseToken(firebaseToken)
          if (!fbUser?.email) return null

          const isAdmin = isAdminEmail(fbUser.email)

          const user = await prisma.user.upsert({
            where: { email: fbUser.email },
            update: {
              name: fbUser.displayName ?? undefined,
              image: fbUser.photoUrl ?? undefined,
            },
            create: {
              email: fbUser.email,
              name: fbUser.displayName ?? fbUser.email,
              image: fbUser.photoUrl ?? null,
              role: isAdmin ? "ADMIN" : "STAFF",
              status: isAdmin ? "APPROVED" : "PENDING",
            },
            include: { investor: true },
          })

          if (isAdmin && (user.role !== "ADMIN" || user.status !== "APPROVED")) {
            await prisma.user.update({
              where: { email: fbUser.email },
              data: { role: "ADMIN", status: "APPROVED" },
            })
          }

          if (user.status !== "APPROVED") {
            console.log("[Auth] User account pending approval:", user.email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: isAdmin ? "ADMIN" : user.role,
            investor: user.investor,
          }
        } catch (err) {
          console.error("[Auth] authorize error:", err)
          return null
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.image = user.image
        token.investor = (user as any).investor ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.image = token.image as string
        ;(session.user as any).role = token.role
        ;(session.user as any).investor = token.investor
      }
      return session
    },
  },
})
