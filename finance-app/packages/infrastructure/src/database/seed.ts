import { config } from 'dotenv'

config({ path: '../../.env' })

const { createPrismaClient } = await import('./client')
const { createAuth } = await import('../auth')
const {
  PrismaAccountRepository,
  PrismaBudgetRepository,
  PrismaCategoryRepository,
  PrismaGoalRepository,
  PrismaTransactionRepository,
} = await import('./repositories')
const {
  makeCreateAccount,
  makeCreateBudget,
  makeCreateDefaultCategories,
  makeCreateGoal,
  makeCreateTransaction,
} = await import('@finance/domain')

const DEMO_EMAIL = 'demo@financeapp.dev'
const DEMO_PASSWORD = 'DemoPass123!'

async function main() {
  const prisma = createPrismaClient()
  const auth = createAuth(prisma, {
    secret: process.env.BETTER_AUTH_SECRET ?? 'seed-secret-not-for-production',
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  })

  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })

  if (!user) {
    await auth.api.signUpEmail({
      body: {
        name: 'Usuario Demo',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    })
    user = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } })
  }

  const categoryRepo = new PrismaCategoryRepository(prisma)
  const accountRepo = new PrismaAccountRepository(prisma)
  const transactionRepo = new PrismaTransactionRepository(prisma)
  const budgetRepo = new PrismaBudgetRepository(prisma)
  const goalRepo = new PrismaGoalRepository(prisma)

  await makeCreateDefaultCategories({ categoryRepo })(user.id)

  const existingAccounts = await accountRepo.findByUserId(user.id)
  if (existingAccounts.length === 0) {
    const createAccount = makeCreateAccount({ accountRepo })
    const checking = await createAccount(user.id, {
      name: 'Cuenta principal',
      type: 'CHECKING',
      balance: 12500,
      currency: 'MXN',
    })
    await createAccount(user.id, {
      name: 'Ahorro',
      type: 'SAVINGS',
      balance: 8500,
      currency: 'MXN',
    })

    const categories = await categoryRepo.findByUserId(user.id)
    const salary = categories.find((category) => category.name === 'Salario')
    const food = categories.find((category) => category.name === 'Alimentación')
    const transport = categories.find((category) => category.name === 'Transporte')

    if (salary && food && transport) {
      const createTransaction = makeCreateTransaction({
        transactionRepo,
        accountRepo,
        categoryRepo,
      })

      await createTransaction(user.id, {
        amount: 18000,
        type: 'INCOME',
        categoryId: salary.id,
        accountId: checking.id,
        description: 'Ingreso mensual',
        date: new Date(),
      })
      await createTransaction(user.id, {
        amount: 1250,
        type: 'EXPENSE',
        categoryId: food.id,
        accountId: checking.id,
        description: 'Supermercado',
        date: new Date(),
      })
      await createTransaction(user.id, {
        amount: 480,
        type: 'EXPENSE',
        categoryId: transport.id,
        accountId: checking.id,
        description: 'Transporte mensual',
        date: new Date(),
      })

      await makeCreateBudget({ budgetRepo, categoryRepo })(user.id, {
        amount: 4000,
        period: 'MONTHLY',
        categoryId: food.id,
        startDate: new Date(),
      })
    }

    await makeCreateGoal({ goalRepo })(user.id, {
      name: 'Fondo de emergencia',
      targetAmount: 50000,
      deadline: new Date(new Date().getFullYear() + 1, 0, 1),
    })
  }

  console.log(`Demo ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  process.exitCode = 1
})
