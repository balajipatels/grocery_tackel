"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Store, AlertCircle, Mail, Lock, User, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFirebaseApp } from "@/lib/firebase"

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
      const auth = getAuth(getFirebaseApp())
      const result = await createUserWithEmailAndPassword(auth, email, password)
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() })
      }
      const idToken = await result.user.getIdToken()
      const res = await signIn("credentials", { firebaseToken: idToken, redirect: false })
      if (res?.error) {
        setError("Account created but sign-in failed. Please go to login.")
        setLoading(false)
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      const code = err?.code
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in.")
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.")
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.")
      } else {
        setError("Registration failed. Please try again.")
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D8F3DC] rounded-2xl mb-4">
            <Store className="w-8 h-8 text-[#1B4332]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm">{process.env.NEXT_PUBLIC_SHOP_NAME || "GroceryOS"}</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="pl-10 h-11 rounded-xl border-gray-200"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="pl-10 h-11 rounded-xl border-gray-200"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className="pl-10 h-11 rounded-xl border-gray-200"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#1B4332] hover:bg-[#0F6E56] text-white rounded-xl font-medium"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Create Account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1B4332] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
