import "dotenv/config"
const baseUrl = "http://localhost:3000"

async function fetchWithCookies(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  const cookieJar: string[] = []
  const setCookie = (resp: Response) => {
    const setCookieHeaders = resp.headers.getSetCookie?.() ?? []
    setCookieHeaders.forEach((c) => {
      const [pair] = c.split(";")
      const [name, ...rest] = pair.split("=")
      const value = rest.join("=")
      const existing = cookieJar.findIndex((c) => c.startsWith(name + "="))
      if (existing >= 0) cookieJar[existing] = `${name}=${value}`
      else cookieJar.push(`${name}=${value}`)
    })
    return cookieJar.join("; ")
  }

  if (cookieJar.length > 0) {
    headers.set("Cookie", cookieJar.join("; "))
  }

  const resp = await fetch(url, { ...options, headers, redirect: "manual" })
  setCookie(resp)
  return resp
}

async function main() {
  // 1. Get CSRF - capture cookie
  const csrfResp = await fetch(`${baseUrl}/api/auth/csrf`)
  const csrfCookies = csrfResp.headers.getSetCookie?.() ?? []
  const csrfCookie = csrfCookies.find((c) => c.includes("csrf-token"))?.split(";")[0] ?? ""
  console.log("CSRF cookie:", csrfCookie)
  const csrfData = await csrfResp.json()
  console.log("CSRF token:", csrfData.csrfToken.slice(0, 20) + "...")

  // 2. Login
  const loginResp = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: "admin@shoply.dev",
      password: "admin123",
      callbackUrl: `${baseUrl}/`,
      json: "true",
    }),
    redirect: "manual",
  })
  console.log("Login:", loginResp.status)
  console.log("Location:", loginResp.headers.get("location"))
  console.log("ALL HEADERS:")
  loginResp.headers.forEach((v, k) => console.log(`  ${k}: ${v.slice(0, 100)}`))
  const setCookies = loginResp.headers.getSetCookie?.() ?? []
  console.log("Set-Cookie count:", setCookies.length)
  setCookies.forEach((c) => console.log("  ", c.split(";")[0]))

  // 3. Build cookie jar manually
  const cookies: string[] = []
  setCookies.forEach((c) => {
    const [pair] = c.split(";")
    const [name, ...rest] = pair.split("=")
    const value = rest.join("=")
    const existing = cookies.findIndex((c) => c.startsWith(name + "="))
    if (existing >= 0) cookies[existing] = `${name}=${value}`
    else cookies.push(`${name}=${value}`)
  })
  cookies.push(csrfCookie)
  const cookieHeader = cookies.join("; ")

  // 4. Check session
  const sessResp = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  })
  const sessData = await sessResp.json()
  console.log("Session:", JSON.stringify(sessData).slice(0, 100))

  // 5. Get CSV
  const csvResp = await fetch(`${baseUrl}/api/admin/orders/export`, {
    headers: { Cookie: cookieHeader },
  })
  console.log("\nCSV:", csvResp.status, csvResp.headers.get("Content-Type"))
  if (csvResp.status === 200) {
    const csvText = await csvResp.text()
    console.log("Size:", csvText.length, "bytes")
    console.log("First 300 chars:", csvText.slice(0, 300))
  }
}

main().catch(console.error)
