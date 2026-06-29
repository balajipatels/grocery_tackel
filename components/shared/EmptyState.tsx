"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-[#D8F3DC] rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[#1B4332]" />
      </div>
      <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-[#1B4332] hover:bg-[#0F6E56] text-white"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
