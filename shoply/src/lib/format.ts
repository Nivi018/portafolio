export function formatOrderStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function formatPrice(price: number | string | { toString(): string }) {
  const num = typeof price === "number" ? price : parseFloat(price.toString())
  return `$${num.toFixed(2)}`
}

export function formatDistanceToNow(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}
