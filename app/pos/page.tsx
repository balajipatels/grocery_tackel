"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Search, X, Minus, Plus, ShoppingCart, CheckCircle2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store/cart"
import { formatINR } from "@/lib/format"
import Link from "next/link"
import SessionProvider from "@/components/providers/SessionProvider"
import QueryProvider from "@/components/providers/QueryProvider"
import { Toaster } from "@/components/ui/sonner"

type Product = {
  id: string
  name: string
  sellingPrice: number
  buyingPrice: number
  stockQty: number
  unit: string
  imageUrl?: string | null
  isActive: boolean
  category: { id: string; name: string; cgstPercent: number; sgstPercent: number; isQuickService: boolean; colorHex: string }
}

type Category = { id: string; name: string; isQuickService: boolean; colorHex: string }

function POSContent() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [billSuccess, setBillSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const cart = useCartStore()

  const { data: productsData } = useQuery({
    queryKey: ["pos-products", search, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" })
      if (search) params.set("search", search)
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory)
      return fetch(`/api/products?${params}`).then((r) => r.json())
    },
    staleTime: 30000,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
    staleTime: 60000,
  })

  const products: Product[] = productsData?.products || []

  const handleGenerateBill = async () => {
    if (cart.items.length === 0) { toast.error("Cart is empty"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customerName: cart.customerName || null,
          customerPhone: cart.customerPhone || null,
          paymentMethod: cart.paymentMethod,
          discountAmount: cart.discount,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create bill")
      }
      const bill = await res.json()
      setBillSuccess(true)
      cart.clearCart()
      window.open(`/bills/${bill.id}`, "_blank")
      setTimeout(() => setBillSuccess(false), 3000)
      toast.success(`Bill ${bill.billNumber} created successfully!`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#F8FAF9] overflow-hidden">
      {/* Left Panel — Products */}
      <div className="flex-1 flex flex-col h-full border-r border-gray-200 bg-white min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <Link href="/dashboard" className="text-sm font-bold text-[#1B4332] flex items-center gap-2">
            ← GroceryOS POS
          </Link>
          <div className="relative flex-1 max-w-sm mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, SKU or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-gray-100 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              selectedCategory === "all" ? "bg-[#1B4332] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedCategory === cat.id ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: cat.colorHex } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => {
                const inCart = cart.items.find((i) => i.productId === product.id)
                const outOfStock = product.stockQty <= 0
                return (
                  <button
                    key={product.id}
                    disabled={outOfStock}
                    onClick={() =>
                      cart.addItem({
                        productId: product.id,
                        name: product.name,
                        sellingPrice: product.sellingPrice,
                        buyingPrice: product.buyingPrice,
                        cgstPercent: product.category.cgstPercent,
                        sgstPercent: product.category.sgstPercent,
                        unit: product.unit,
                        imageUrl: product.imageUrl,
                        stockQty: product.stockQty,
                      })
                    }
                    className={`relative text-left rounded-xl border p-3 transition-all duration-200 ${
                      outOfStock
                        ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200"
                        : inCart
                          ? "border-[#1B4332] bg-[#D8F3DC] shadow-sm"
                          : "border-gray-200 bg-white hover:border-[#52B788] hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="w-full h-20 rounded-lg mb-2.5 flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: product.category.colorHex + "CC" }}
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        product.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#1A1A2E] leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-sm font-bold text-[#1B4332] mt-1">{formatINR(product.sellingPrice)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{product.unit}</span>
                      {outOfStock ? (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1">Out</Badge>
                      ) : product.stockQty <= 5 ? (
                        <Badge className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700 border-amber-200">
                          {product.stockQty} left
                        </Badge>
                      ) : null}
                    </div>
                    {inCart && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#1B4332] rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">{inCart.quantity}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Cart */}
      <div className="w-80 xl:w-96 flex flex-col h-full bg-white border-l border-gray-100">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1A1A2E]">Current Bill</h2>
            {cart.items.length > 0 && (
              <button onClick={cart.clearCart} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1A1A2E] truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatINR(item.sellingPrice)} / {item.unit}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => cart.updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => cart.updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100" disabled={item.quantity >= item.stockQty}>
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => cart.removeItem(item.productId)} className="w-6 h-6 rounded-md text-red-400 hover:bg-red-50 flex items-center justify-center ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right min-w-[56px]">
                  <p className="text-xs font-bold text-[#1A1A2E]">{formatINR(item.sellingPrice * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer + Payment */}
        <div className="border-t border-gray-100 px-4 pt-3 pb-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Customer name"
              value={cart.customerName}
              onChange={(e) => cart.setCustomerName(e.target.value)}
              className="h-8 text-xs border-gray-200"
            />
            <Input
              placeholder="Phone number"
              value={cart.customerPhone}
              onChange={(e) => cart.setCustomerPhone(e.target.value)}
              className="h-8 text-xs border-gray-200"
            />
          </div>
          <div className="flex gap-1.5">
            {(["CASH", "UPI", "CARD"] as const).map((m) => (
              <button
                key={m}
                onClick={() => cart.setPaymentMethod(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  cart.paymentMethod === m
                    ? "bg-[#1B4332] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Discount ₹</span>
            <Input
              type="number"
              placeholder="0"
              value={cart.discount || ""}
              onChange={(e) => cart.setDiscount(parseFloat(e.target.value) || 0)}
              className="h-8 text-xs border-gray-200"
              min="0"
            />
          </div>
        </div>

        {/* Bill Breakdown */}
        <div className="border-t border-gray-100 px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span><span>{formatINR(cart.subtotal())}</span>
          </div>
          {cart.totalCgst() > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>CGST</span><span>{formatINR(cart.totalCgst())}</span>
            </div>
          )}
          {cart.totalSgst() > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>SGST</span><span>{formatINR(cart.totalSgst())}</span>
            </div>
          )}
          {cart.discount > 0 && (
            <div className="flex justify-between text-xs text-green-600">
              <span>Discount</span><span>-{formatINR(cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm text-[#1A1A2E] pt-1.5 border-t border-gray-100">
            <span>TOTAL</span><span>{formatINR(cart.grandTotal())}</span>
          </div>
        </div>

        {/* Generate Bill Button */}
        <div className="px-4 pb-4">
          {billSuccess ? (
            <div className="w-full h-14 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-700 font-medium">
              <CheckCircle2 className="w-5 h-5" /> Bill Generated!
            </div>
          ) : (
            <Button
              onClick={handleGenerateBill}
              disabled={loading || cart.items.length === 0}
              className="w-full h-14 bg-[#1B4332] hover:bg-[#0F6E56] text-white text-base font-semibold rounded-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                `Generate Bill • ${formatINR(cart.grandTotal())}`
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function POSPage() {
  return (
    <SessionProvider>
      <QueryProvider>
        <POSContent />
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </SessionProvider>
  )
}
