import { create } from "zustand"

export type CartItem = {
  productId: string
  name: string
  sellingPrice: number
  buyingPrice: number
  cgstPercent: number
  sgstPercent: number
  unit: string
  imageUrl?: string | null
  quantity: number
  stockQty: number
}

type CartStore = {
  items: CartItem[]
  customerName: string
  customerPhone: string
  paymentMethod: "CASH" | "UPI" | "CARD"
  discount: number

  addItem: (product: Omit<CartItem, "quantity">) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, quantity: number) => void
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setPaymentMethod: (method: "CASH" | "UPI" | "CARD") => void
  setDiscount: (amount: number) => void
  clearCart: () => void

  subtotal: () => number
  totalCgst: () => number
  totalSgst: () => number
  grandTotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerName: "",
  customerPhone: "",
  paymentMethod: "CASH",
  discount: 0,

  addItem: (product) => {
    const existing = get().items.find((i) => i.productId === product.productId)
    if (existing) {
      if (existing.quantity >= existing.stockQty) return
      set((s) => ({
        items: s.items.map((i) =>
          i.productId === product.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }))
    } else {
      set((s) => ({ items: [...s.items, { ...product, quantity: 1 }] }))
    }
  },

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

  updateQty: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((s) => ({
      items: s.items.map((i) => {
        if (i.productId !== productId) return i
        const newQty = Math.min(quantity, i.stockQty)
        return { ...i, quantity: newQty }
      }),
    }))
  },

  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDiscount: (amount) => set({ discount: amount }),

  clearCart: () =>
    set({ items: [], customerName: "", customerPhone: "", paymentMethod: "CASH", discount: 0 }),

  subtotal: () =>
    get().items.reduce((s, i) => s + i.sellingPrice * i.quantity, 0),

  totalCgst: () =>
    get().items.reduce((s, i) => s + (i.sellingPrice * i.quantity * i.cgstPercent) / 100, 0),

  totalSgst: () =>
    get().items.reduce((s, i) => s + (i.sellingPrice * i.quantity * i.sgstPercent) / 100, 0),

  grandTotal: () => {
    const { discount } = get()
    return get().subtotal() + get().totalCgst() + get().totalSgst() - discount
  },
}))
