import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import QueryProvider from "@/components/providers/QueryProvider"
import FirebaseAnalytics from "@/components/providers/FirebaseAnalytics"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "GroceryOS — Retail Management",
  description: "Smart grocery shop management system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#F8FAF9] text-[#1A1A2E]" suppressHydrationWarning>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" />
        <FirebaseAnalytics />
      </body>
    </html>
  )
}
