import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) return null
  if (adminClient) return adminClient
  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}

/**
 * Generate a signed download URL for a file in Supabase Storage.
 * Returns null if Supabase isn't configured.
 */
export async function getSignedDownloadUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 60, // 1 hour
): Promise<string | null> {
  const client = getSupabaseAdmin()
  if (!client) return null

  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}

/**
 * Track a download by incrementing the count for an order item.
 */
export async function trackDownload(orderItemId: string): Promise<number> {
  // For now, this is a stub. In production, you'd track downloads in the DB.
  return 0
}
