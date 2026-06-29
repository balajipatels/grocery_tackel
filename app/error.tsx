"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#1A1A2E]">Something went wrong</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {error.digest}</p>
        )}
      </div>
      <Button
        onClick={reset}
        size="sm"
        className="bg-[#1B4332] hover:bg-[#0F6E56] text-white gap-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Try again
      </Button>
    </div>
  )
}
