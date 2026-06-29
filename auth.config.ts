import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const publicPaths = ["/login", "/register", "/api/auth"]
      const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p))
      if (isPublic) return true
      return isLoggedIn
    },
  },
}
