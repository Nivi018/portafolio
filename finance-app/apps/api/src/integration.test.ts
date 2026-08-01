import { afterAll, describe, expect, it } from 'vitest'
import { app } from './app'
import { container } from './lib/container'

const runIntegration = process.env.RUN_DB_INTEGRATION === 'true'
const describeIntegration = runIntegration ? describe : describe.skip
const testEmail = `integration-${crypto.randomUUID()}@financeapp.dev`
const secondTestEmail = `integration-${crypto.randomUUID()}@financeapp.dev`
let userId: string | undefined
let secondUserId: string | undefined
const financialSpaceIds: string[] = []

function cookieHeader(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] }
  const cookies = headers.getSetCookie?.() ?? [response.headers.get('set-cookie') ?? '']
  return cookies
    .filter(Boolean)
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
}

function localDateValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describeIntegration('API integration', () => {
  afterAll(async () => {
    await Promise.all(
      financialSpaceIds.map((id) =>
        container.prisma.financialSpace.delete({ where: { id } }).catch(() => undefined)
      )
    )
    if (userId) {
      await container.prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
    }
    if (secondUserId) {
      await container.prisma.user.delete({ where: { id: secondUserId } }).catch(() => undefined)
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
    const mePayload = (await me.json()) as {
      data: { id: string; email: string; financialSpace: { id: string; name: string; role: string } }
    }
    userId = mePayload.data.id
    expect(mePayload.data.email).toBe(testEmail)
    expect(mePayload.data.financialSpace).toMatchObject({ name: 'Personal', role: 'OWNER' })
    financialSpaceIds.push(mePayload.data.financialSpace.id)

    const membership = await container.prisma.financialSpaceMember.findUnique({
      where: {
        financialSpaceId_userId: {
          financialSpaceId: mePayload.data.financialSpace.id,
          userId,
        },
      },
    })
    expect(membership?.role).toBe('OWNER')

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
        date: localDateValue(),
      }),
    })
    expect(transaction.status).toBe(201)

    const planItem = await app.request('/api/plan-items', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Supermercado semanal',
        amount: 120,
        type: 'EXPENSE',
        frequency: 'WEEKLY',
        categoryId: categoriesPayload.data[0]?.id,
        accountId: accountPayload.data.id,
        isFixed: true,
      }),
    })
    expect(planItem.status).toBe(201)
    const planItemPayload = (await planItem.json()) as { data: { monthlyEquivalent: number; yearlyEquivalent: number } }
    expect(planItemPayload.data.monthlyEquivalent).toBe(521.78)
    expect(planItemPayload.data.yearlyEquivalent).toBe(6261.3)

    const comparison = await app.request(
      `/api/reports/plan-vs-actual?from=${localDateValue().slice(0, 7)}-01&to=${localDateValue()}`,
      { headers: { Cookie: cookie } },
    )
    expect(comparison.status).toBe(200)
    const comparisonPayload = (await comparison.json()) as {
      data: { plannedExpense: number; actualExpense: number; months: unknown[] }
    }
    expect(comparisonPayload.data.plannedExpense).toBe(521.78)
    expect(comparisonPayload.data.actualExpense).toBe(120)
    expect(comparisonPayload.data.months).toHaveLength(1)

    const creditAccount = await app.request('/api/accounts', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tarjeta de prueba', type: 'CREDIT', balance: -2500, currency: 'MXN' }),
    })
    expect(creditAccount.status).toBe(201)
    const creditAccountPayload = (await creditAccount.json()) as { data: { id: string } }

    const creditCard = await app.request('/api/credit-cards', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: creditAccountPayload.data.id, bank: 'Banco Prueba', product: 'Oro', creditLimit: 10000, apr: 39.9, statementCloseDay: 15, paymentDueDay: 5 }),
    })
    expect(creditCard.status).toBe(201)

    const creditCards = await app.request('/api/credit-cards', { headers: { Cookie: cookie } })
    expect(creditCards.status).toBe(200)
    const creditCardsPayload = (await creditCards.json()) as { data: Array<{ debt: number; utilization: number; availableCredit: number }> }
    expect(creditCardsPayload.data[0]).toMatchObject({ debt: 2500, utilization: 25, availableCredit: 7500 })

    const dashboard = await app.request('/api/dashboard', { headers: { Cookie: cookie } })
    expect(dashboard.status).toBe(200)
    const dashboardPayload = (await dashboard.json()) as {
      data: { summary: { totalBalance: number; monthlyExpense: number } }
    }
    expect(dashboardPayload.data.summary.totalBalance).toBe(-1620)
    expect(dashboardPayload.data.summary.monthlyExpense).toBe(120)

    const secondSignUp = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify({ name: 'Second Integration User', email: secondTestEmail, password: 'IntegrationPass123!' }),
    })
    expect(secondSignUp.status).toBe(200)
    const secondCookie = cookieHeader(secondSignUp)

    const secondMe = await app.request('/api/auth/me', { headers: { Cookie: secondCookie } })
    expect(secondMe.status).toBe(200)
    const secondMePayload = (await secondMe.json()) as {
      data: { id: string; financialSpace: { id: string; name: string; role: string } }
    }
    secondUserId = secondMePayload.data.id
    expect(secondMePayload.data.financialSpace).toMatchObject({ name: 'Personal', role: 'OWNER' })
    expect(secondMePayload.data.financialSpace.id).not.toBe(mePayload.data.financialSpace.id)
    financialSpaceIds.push(secondMePayload.data.financialSpace.id)

    const secondAccounts = await app.request('/api/accounts', { headers: { Cookie: secondCookie } })
    expect(secondAccounts.status).toBe(200)
    expect((await secondAccounts.json()) as { data: unknown[] }).toEqual({ data: [] })

    const household = await app.request('/api/financial-spaces', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hogar de integración' }),
    })
    expect(household.status).toBe(201)
    const householdPayload = (await household.json()) as { data: { id: string; type: string } }
    expect(householdPayload.data.type).toBe('HOUSEHOLD')
    financialSpaceIds.push(householdPayload.data.id)

    const invite = await app.request(`/api/financial-spaces/${householdPayload.data.id}/members`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: secondTestEmail, role: 'EDITOR' }),
    })
    expect(invite.status).toBe(201)

    const sharedAccounts = await app.request('/api/accounts', {
      headers: { Cookie: secondCookie, 'x-financial-space-id': householdPayload.data.id },
    })
    expect(sharedAccounts.status).toBe(200)

    const editorAccount = await app.request('/api/accounts', {
      method: 'POST',
      headers: {
        Cookie: secondCookie,
        'Content-Type': 'application/json',
        'x-financial-space-id': householdPayload.data.id,
      },
      body: JSON.stringify({ name: 'Cuenta compartida', type: 'CHECKING', balance: 0, currency: 'MXN' }),
    })
    expect(editorAccount.status).toBe(201)

    const viewer = await app.request(
      `/api/financial-spaces/${householdPayload.data.id}/members/${secondUserId}`,
      {
        method: 'PATCH',
        headers: { Cookie: cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'VIEWER' }),
      },
    )
    expect(viewer.status).toBe(200)

    const viewerWrite = await app.request('/api/accounts', {
      method: 'POST',
      headers: {
        Cookie: secondCookie,
        'Content-Type': 'application/json',
        'x-financial-space-id': householdPayload.data.id,
      },
      body: JSON.stringify({ name: 'No permitido', type: 'CHECKING', balance: 0, currency: 'MXN' }),
    })
    expect(viewerWrite.status).toBe(403)
  })
})
