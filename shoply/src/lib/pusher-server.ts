"use server"

import Pusher from "pusher"

let singleton: Pusher | null = null

export function getPusherServer() {
  if (singleton) return singleton
  const appId = process.env.PUSHER_APP_ID
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2"

  if (!appId || !key || !secret) return null

  singleton = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  })

  return singleton
}

export async function notifyNewOrder(orderId: string, orderNumber: string, total: number) {
  const pusher = getPusherServer()
  if (!pusher) return
  await pusher.trigger("admin", "new-order", {
    orderId,
    orderNumber,
    total,
  })
}

export async function notifyLowStock(productId: string, productName: string, stock: number) {
  const pusher = getPusherServer()
  if (!pusher) return
  await pusher.trigger("admin", "low-stock", {
    productId,
    productName,
    stock,
  })
}
