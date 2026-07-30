import "dotenv/config"
const baseUrl = "http://localhost:3000"

async function main() {
  // 1. CSRF
  const csrfResp = await fetch(`${baseUrl}/api/auth/csrf`)
  const csrfCookies = csrfResp.headers.getSetCookie?.() ?? []
  const csrfCookie = csrfCookies.find((c) => c.includes("csrf-token"))?.split(";")[0] ?? ""
  const csrfData = await csrfResp.json()

  // 2. Login as client (to test PDF for an order they own)
  const loginResp = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: "client@shoply.dev",
      password: "client123",
      callbackUrl: `${baseUrl}/`,
      json: "true",
    }),
    redirect: "manual",
  })
  const setCookies = loginResp.headers.getSetCookie?.() ?? []
  const cookies: string[] = [csrfCookie]
  setCookies.forEach((c) => {
    const [pair] = c.split(";")
    const [name, ...rest] = pair.split("=")
    const value = rest.join("=")
    const existing = cookies.findIndex((c) => c.startsWith(name + "="))
    if (existing >= 0) cookies[existing] = `${name}=${value}`
    else cookies.push(`${name}=${value}`)
  })
  const cookieHeader = cookies.join("; ")

  // 3. Get orders list
  const ordersResp = await fetch(`${baseUrl}/account/orders`, {
    headers: { Cookie: cookieHeader },
  })
  const ordersHtml = await ordersResp.text()
  const match = ordersHtml.match(/href="\/account\/orders\/([a-z0-9]+)"/)
  if (!match) {
    console.log("No orders found")
    return
  }
  const orderId = match[1]
  console.log("Order ID:", orderId)

  // 4. Download PDF
  const pdfResp = await fetch(`${baseUrl}/api/account/orders/${orderId}/invoice`, {
    headers: { Cookie: cookieHeader },
  })
  console.log("PDF Status:", pdfResp.status)
  console.log("Content-Type:", pdfResp.headers.get("content-type"))
  console.log("Content-Disposition:", pdfResp.headers.get("content-disposition"))
  const buffer = await pdfResp.arrayBuffer()
  console.log("PDF Size:", buffer.byteLength, "bytes")
  // First bytes should be %PDF
  const head = new TextDecoder().decode(new Uint8Array(buffer).slice(0, 8))
  console.log("PDF Header:", head)
}

main().catch(console.error)
