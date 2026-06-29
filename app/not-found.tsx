import Link from "next/link"
import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D8F3DC] rounded-2xl mb-5">
          <Store className="w-8 h-8 text-[#1B4332]" />
        </div>
        <h1 className="text-5xl font-bold text-[#1A1A2E] mb-2">404</h1>
        <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">Page not found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button className="bg-[#1B4332] hover:bg-[#0F6E56] text-white">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
