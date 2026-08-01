import { describe, expect, it } from 'vitest'
import { app } from './app'

describe('API app', () => {
  it('returns health status without authentication', async () => {
    const response = await app.request('/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' })
  })

  it('rejects protected endpoints without a Better Auth session', async () => {
    const response = await app.request('/api/credit-simulator', { method: 'POST' })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ code: 'UNAUTHORIZED' })
  })
})
