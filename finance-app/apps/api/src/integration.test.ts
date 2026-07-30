import { afterAll, describe, expect, it } from 'vitest'
import { app } from './app'
import { container } from './lib/container'

const runIntegration = process.env.RUN_DB_INTEGRATION === 'true'
const describeIntegration = runIntegration ? describe : describe.skip
const testEmail = `integration-${crypto.randomUUID()}@financeapp.dev`
let userId: string | undefined

function cookieHeader(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }
  const cookies = headers.getSetCookie?.() ?? [response.headers.get('set-cookie') ?? '']
  return cookies
    .filter(Boolean)
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
}

describeIntegration('API integration', () => {
  afterAll(async () => {
    if (userId) {
      await container.prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }
  })

  it('creates an isolated authenticated finance workspace', async () => {
    const signUp = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ name: 'Integration User', email: testEmail, password: 'IntegrationPass123!' }),
    })

    expect(signUp.status).toBe(200)
    const cookie = cookieHeader(signUp)
    expect(cookie).not.toBe('')

    const bootstrap = await app.request('/api/auth/bootstrap', {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    expect(bootstrap.status).toBe(200)

    const me = await app.request('/api/auth/me', { headers: { Cookie: cookie } })
    expect(me.status).toBe(200)
    const mePayload = (await me.json()) as { data: { id: string; email: string } }
    userId = mePayload.data.id
    expect(mePayload.data.email).toBe(testEmail)

    const accounts = await app.request('/api/accounts', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Cuenta de prueba', type: 'CHECKING', balance: 1000, currency: 'MXN' }),
    })
    expect(accounts.status).toBe(201)
    const accountPayload = (await accounts.json()) as { data: { id: string } }

    const categoriesResponse = await app.request('/api/categories?type=EXPENSE', {
      headers: { Cookie: cookie },
    })
    const categoriesPayload = (await categoriesResponse.json()) as { data: Array<{ id: string }> }
    expect(categoriesPayload.data.length).toBeGreaterThan(0)

    const transaction = await app.request('/api/transactions', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 120,
        description: 'Movimiento de integración',
        type: 'EXPENSE',
        accountId: accountPayload.data.id,
        categoryId: categoriesPayload.data[0]?.id,
      }),
    })
    expect(transaction.status).toBe(201)

    const dashboard = await app.request('/api/dashboard', { headers: { Cookie: cookie } })
    expect(dashboard.status).toBe(200)
    const dashboardPayload = (await dashboard.json()) as {
      data: { summary: { totalBalance: number; monthlyExpense: number } }
    }
    expect(dashboardPayload.data.summary.totalBalance).toBe(880)
    expect(dashboardPayload.data.summary.monthlyExpense).toBe(120)
  })
})
