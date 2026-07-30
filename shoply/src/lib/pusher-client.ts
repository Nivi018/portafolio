"use client"

import PusherClient from "pusher-js"

let singleton: PusherClient | null = null

export function getPusherClient() {
  if (singleton) return singleton

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2"

  if (!key) {
    // Return a no-op client for dev/SSG. Pusher will only be initialized
    // when env vars are present.
    return null
  }

  singleton = new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
  })

  return singleton
}

export const pusherClient = getPusherClient() as PusherClient | null
