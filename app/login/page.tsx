"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Store, AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFirebaseApp } from "@/lib/firebase"

async function firebaseSignInAndCreateSession(idToken: string): Promise<string | null> {
  const res = await signIn("credentials", { firebaseToken: idToken, redirect: false })
  return res?.error ?? null
}

export default function LoginPage() {
  const [loading, setLoading] = useState<"google" | "email" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setLoading("google")
    setError(null)
    try {
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import("firebase/auth")
      const auth = getAuth(getFirebaseApp())
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const idToken = await result.user.getIdToken()
      const err = await firebaseSignInAndCreateSession(idToken)
      if (err) {
        if (err.includes("CredentialsSignin") || err.includes("Configuration")) {
          setError("Your account is pending admin approval. Please contact the administrator.")
        } else {
          setError("Access denied. You are not authorised to use this system.")
        }
        setLoading(null)
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.")
      }
      setLoading(null)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading("email")
    setError(null)
    try {
      const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth")
      const auth = getAuth(getFirebaseApp())
      const result = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await result.user.getIdToken()
      const err = await firebaseSignInAndCreateSession(idToken)
      if (err) {
        if (err.includes("CredentialsSignin") || err.includes("Configuration")) {
          setError("Your account is pending admin approval. Please contact the administrator.")
        } else {
          setError("Access denied. You are not authorised to use this system.")
        }
        setLoading(null)
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      const code = err?.code
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Incorrect email or password.")
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.")
      } else {
        setError("Sign in failed. Please try again.")
      }
      setLoading(null)
    }
  }

  const isLoading = loading !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D8F3DC] rounded-2xl mb-4">
            <Store className="w-8 h-8 text-[#1B4332]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">Welcome to GroceryOS</h1>
          <p className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_SHOP_NAME || "Retail Management System"}</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Google */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full h-12 border-2 border-gray-200 text-[#1A1A2E] hover:bg-gray-50 rounded-xl font-medium gap-3"
        >
          {loading === "google" ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {loading === "google" ? "Signing in…" : "Continue with Google"}
        </Button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email / Password */}
        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-11 rounded-xl border-gray-200"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="pl-10 pr-10 h-11 rounded-xl border-gray-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#1B4332] hover:bg-[#0F6E56] text-white rounded-xl font-medium"
          >
            {loading === "email" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Sign In"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#1B4332] font-semibold hover:underline">
            Create one
          </Link>
        </p>

        <p className="mt-3 text-center text-xs text-gray-400">
          Secure login via Firebase. Only authorised users can access this system.
        </p>
      </div>
    </div>
  )
}
