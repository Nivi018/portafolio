import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './modules/auth/auth.routes'
import { accountsRoutes } from './modules/accounts/accounts.routes'
import { assetsRoutes } from './modules/assets/assets.routes'
import { budgetsRoutes } from './modules/budgets/budgets.routes'
import { categoriesRoutes } from './modules/categories/categories.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { goalsRoutes } from './modules/goals/goals.routes'
import { financialSpacesRoutes } from './modules/financial-spaces/financial-spaces.routes'
import { creditCardsRoutes } from './modules/credit-cards/credit-cards.routes'
import { loansRoutes } from './modules/loans/loans.routes'
import { planItemsRoutes } from './modules/plan-items/plan-items.routes'
import { recurringRoutes } from './modules/recurring/recurring.routes'
import { reportsRoutes } from './modules/reports/reports.routes'
import { transactionsRoutes } from './modules/transactions/transactions.routes'
import { metricsRoutes } from './modules/metrics/metrics.routes'
import { creditSimulatorRoutes } from './modules/credit-simulator/credit-simulator.routes'
import { env } from './lib/env'
import { errorHandler } from './middleware/error'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: env.BETTER_AUTH_URL,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'x-cron-secret', 'x-financial-space-id'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)
app.onError(errorHandler)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Auth must be mounted before the authenticated product modules.
const routes = app
  .route('/api/auth', authRoutes)
  .route('/api/financial-spaces', financialSpacesRoutes)
  .route('/api/credit-cards', creditCardsRoutes)
  .route('/api/loans', loansRoutes)
  .route('/api/credit-simulator', creditSimulatorRoutes)
  .route('/api/assets', assetsRoutes)
  .route('/api', metricsRoutes)
  .route('/api/plan-items', planItemsRoutes)
  .route('/api/accounts', accountsRoutes)
  .route('/api/categories', categoriesRoutes)
  .route('/api/transactions', transactionsRoutes)
  .route('/api/budgets', budgetsRoutes)
  .route('/api/goals', goalsRoutes)
  .route('/api/recurring', recurringRoutes)
  .route('/api/dashboard', dashboardRoutes)
  .route('/api/reports', reportsRoutes)

export { routes as app }
export type AppType = typeof routes
