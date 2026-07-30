"use server";

import { cookies } from "next/headers";

const DISMISSED_COOKIE = "csat-banner-dismissed";

export async function dismissCsatBanner(): Promise<void> {
  const store = await cookies();
  store.set({
    name: DISMISSED_COOKIE,
    value: "1",
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}
