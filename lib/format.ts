import { format, formatDistanceToNow } from "date-fns"
import { toZonedTime } from "date-fns-tz"

const IST = "Asia/Kolkata"

export function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  })
}

export function formatINRDecimal(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function toIST(date: Date | string): Date {
  return toZonedTime(new Date(date), IST)
}

export function formatDate(date: Date | string): string {
  return format(toIST(date), "dd/MM/yyyy")
}

export function formatDateTime(date: Date | string): string {
  return format(toIST(date), "dd/MM/yyyy HH:mm")
}

export function formatTimeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function generateBillNumber(date: Date, sequence: number): string {
  const d = toIST(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const seq = String(sequence).padStart(4, "0")
  return `BILL-${yyyy}${mm}${dd}-${seq}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
