"use client"

import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showSign?: boolean
}

export default function CurrencyDisplay({
  amount,
  className,
  size = "md",
  showSign = false,
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
    xl: "text-2xl font-bold",
  }

  const colorClass =
    showSign && amount > 0
      ? "text-green-600"
      : showSign && amount < 0
        ? "text-red-600"
        : ""

  return (
    <span className={cn(sizeClasses[size], colorClass, className)}>
      {showSign && amount > 0 ? "+" : ""}
      {formatINR(amount)}
    </span>
  )
}
