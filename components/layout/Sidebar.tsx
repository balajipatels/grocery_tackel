"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  BarChart2,
  Settings,
  ChevronDown,
  Store,
  Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Point of Sale", icon: ShoppingCart },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { href: "/inventory", label: "Products" },
      { href: "/inventory/categories", label: "Categories" },
    ],
  },
  { href: "/bills", label: "Bills", icon: Receipt },
  {
    label: "Finance",
    icon: TrendingUp,
    children: [
      { href: "/finance", label: "P&L Dashboard" },
      { href: "/finance/expenses", label: "Expenses" },
      { href: "/finance/investors", label: "Investors" },
    ],
  },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/profile", label: "My Profile", icon: Store },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(["Inventory", "Finance"])

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#1B4332] flex flex-col z-30">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-[#52B788] rounded-lg flex items-center justify-center">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">GroceryOS</p>
          <p className="text-white/50 text-xs">{process.env.NEXT_PUBLIC_SHOP_NAME || "My Store"}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map((item) => {
          if (item.children) {
            const isOpen = openGroups.includes(item.label)
            const isActive = item.children.some((c) => pathname.startsWith(c.href))
            const Icon = item.icon
            return (
              <div key={item.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    isActive
                      ? "bg-[#52B788]/30 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      isOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          pathname === child.href || pathname.startsWith(child.href + "/")
                            ? "bg-[#52B788] text-white font-medium"
                            : "text-white/60 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1",
                isActive
                  ? "bg-[#52B788] text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Tag className="w-3 h-3 text-white/40" />
          <span className="text-white/40 text-xs">v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}
