import type { TransactionType, CategoryType } from '@finance/shared'
import type {
  Transaction,
  Account,
  Budget,
  Goal,
  Category,
  RecurringTransaction,
  PlanItem,
  CreditCardProfile,
  Loan,
  LoanPayment,
  Asset,
  AssetValuation,
} from '../entities'
import type { DateRange } from '../value-objects'
import type {
  ITransactionRepository,
  IAccountRepository,
  IBudgetRepository,
  IGoalRepository,
  ICategoryRepository,
  IRecurringRepository,
  IPlanItemRepository,
  ICreditCardProfileRepository,
  ILoanRepository,
  IAssetRepository,
  TransactionFilters,
  PaginatedResult,
  TransactionSummary,
  CategoryTotal,
  MonthlyFlowPoint,
  MonthlyCategoryTotal,
} from '../ports'

/**
 * In-memory repository implementations for unit testing use cases
 * WITHOUT a database. This is the payoff of hexagonal architecture:
 * the domain is fully testable in isolation.
 */

export class InMemoryTransactionRepository implements ITransactionRepository {
  items: Transaction[] = []

  async findById(id: string) {
    return this.items.find((t) => t.id === id) ?? null
  }

  async findByFinancialSpaceId(
    financialSpaceId: string,
    filters: TransactionFilters
  ): Promise<PaginatedResult<Transaction>> {
    let filtered = this.items.filter((t) => t.financialSpaceId === financialSpaceId)
    if (filters.type) filtered = filtered.filter((t) => t.type === filters.type)
    if (filters.categoryId) filtered = filtered.filter((t) => t.categoryId === filters.categoryId)
    if (filters.accountId) filtered = filtered.filter((t) => t.accountId === filters.accountId)
    if (filters.from) filtered = filtered.filter((t) => t.date >= filters.from!)
    if (filters.to) filtered = filtered.filter((t) => t.date <= filters.to!)
    if (filters.search)
      filtered = filtered.filter((t) =>
        t.description?.toLowerCase().includes(filters.search!.toLowerCase())
      )

    filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
    const start = (filters.page - 1) * filters.limit
    return { items: filtered.slice(start, start + filters.limit), total: filtered.length }
  }

  async create(transaction: Transaction) {
    this.items.push(transaction)
    return transaction
  }

  async update(transaction: Transaction) {
    const index = this.items.findIndex((t) => t.id === transaction.id)
    if (index >= 0) this.items[index] = transaction
    return transaction
  }

  async delete(id: string) {
    this.items = this.items.filter((t) => t.id !== id)
  }

  async getSummary(financialSpaceId: string, range: DateRange): Promise<TransactionSummary> {
    const txs = this.items.filter(
      (t) => t.financialSpaceId === financialSpaceId && range.contains(t.date)
    )
    const totalIncome = txs.filter((t) => t.isIncome()).reduce((s, t) => s + t.amount, 0)
    const totalExpense = txs.filter((t) => t.isExpense()).reduce((s, t) => s + t.amount, 0)
    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount: txs.length,
    }
  }

  async getCategoryTotals(
    _financialSpaceId: string,
    _range: DateRange,
    _type: TransactionType
  ): Promise<CategoryTotal[]> {
    return []
  }

  async getMonthlyFlow(_financialSpaceId: string, _months: number): Promise<MonthlyFlowPoint[]> {
    return []
  }

  async getMonthlyCategoryTotals(
    financialSpaceId: string,
    range: DateRange
  ): Promise<MonthlyCategoryTotal[]> {
    const totals = new Map<string, MonthlyCategoryTotal>()

    for (const transaction of this.items) {
      if (
        transaction.financialSpaceId !== financialSpaceId ||
        !range.contains(transaction.date)
      ) {
        continue
      }

      const month = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`
      const key = `${month}:${transaction.type}:${transaction.categoryId ?? ''}`
      const current = totals.get(key)
      if (current) current.total += transaction.amount
      else {
        totals.set(key, {
          month,
          type: transaction.type,
          categoryId: transaction.categoryId,
          total: transaction.amount,
        })
      }
    }

    return [...totals.values()]
  }

  async getRecentByFinancialSpaceId(financialSpaceId: string, limit: number) {
    return this.items
      .filter((t) => t.financialSpaceId === financialSpaceId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
  }

  async getTotalSpent(financialSpaceId: string, range: DateRange, categoryId?: string) {
    return this.items
      .filter(
        (t) =>
          t.financialSpaceId === financialSpaceId &&
          t.isExpense() &&
          range.contains(t.date) &&
          (!categoryId || t.categoryId === categoryId)
      )
      .reduce((s, t) => s + t.amount, 0)
  }
}

export class InMemoryAccountRepository implements IAccountRepository {
  items: Account[] = []

  async findById(id: string) {
    return this.items.find((a) => a.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((a) => a.financialSpaceId === financialSpaceId)
  }

  async create(account: Account) {
    this.items.push(account)
    return account
  }

  async update(account: Account) {
    const index = this.items.findIndex((a) => a.id === account.id)
    if (index >= 0) this.items[index] = account
    return account
  }

  async delete(id: string) {
    this.items = this.items.filter((a) => a.id !== id)
  }

  async hasTransactions(_id: string) {
    return false
  }

  async getTotalBalance(financialSpaceId: string) {
    return this.items
      .filter((a) => a.financialSpaceId === financialSpaceId)
      .reduce((s, a) => s + a.balance, 0)
  }
}

export class InMemoryCreditCardProfileRepository implements ICreditCardProfileRepository {
  items: CreditCardProfile[] = []

  constructor(private readonly accountRepo: IAccountRepository) {}

  async findById(id: string) {
    return this.items.find((profile) => profile.id === id) ?? null
  }

  async findByAccountId(accountId: string) {
    return this.items.find((profile) => profile.accountId === accountId) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    const accounts = await this.accountRepo.findByFinancialSpaceId(financialSpaceId)
    const accountIds = new Set(accounts.map((account) => account.id))
    return this.items.filter((profile) => accountIds.has(profile.accountId))
  }

  async create(profile: CreditCardProfile) {
    this.items.push(profile)
    return profile
  }

  async update(profile: CreditCardProfile) {
    const index = this.items.findIndex((item) => item.id === profile.id)
    if (index >= 0) this.items[index] = profile
    return profile
  }
}

export class InMemoryLoanRepository implements ILoanRepository {
  items: Loan[] = []
  payments: LoanPayment[] = []

  async findById(id: string) {
    return this.items.find((loan) => loan.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((loan) => loan.financialSpaceId === financialSpaceId)
  }

  async findPaymentsByLoanId(loanId: string) {
    return this.payments.filter((payment) => payment.loanId === loanId)
  }

  async create(loan: Loan) {
    this.items.push(loan)
    return loan
  }

  async update(loan: Loan) {
    const index = this.items.findIndex((item) => item.id === loan.id)
    if (index >= 0) this.items[index] = loan
    return loan
  }

  async createPayment(payment: LoanPayment) {
    this.payments.push(payment)
    return payment
  }
}

export class InMemoryAssetRepository implements IAssetRepository {
  items: Asset[] = []
  valuations: AssetValuation[] = []
  async findById(id: string) { return this.items.find((asset) => asset.id === id) ?? null }
  async findByFinancialSpaceId(financialSpaceId: string) { return this.items.filter((asset) => asset.financialSpaceId === financialSpaceId) }
  async findValuationsByAssetId(assetId: string) { return this.valuations.filter((valuation) => valuation.assetId === assetId) }
  async create(asset: Asset) { this.items.push(asset); return asset }
  async update(asset: Asset) { const index = this.items.findIndex((item) => item.id === asset.id); if (index >= 0) this.items[index] = asset; return asset }
  async createValuation(valuation: AssetValuation) { this.valuations.push(valuation); return valuation }
}

export class InMemoryCategoryRepository implements ICategoryRepository {
  items: Category[] = []

  async findById(id: string) {
    return this.items.find((c) => c.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((c) => c.financialSpaceId === financialSpaceId)
  }

  async findByFinancialSpaceIdAndType(financialSpaceId: string, type: CategoryType) {
    return this.items.filter((c) => c.financialSpaceId === financialSpaceId && c.type === type)
  }

  async findByName(financialSpaceId: string, name: string) {
    return (
       this.items.find(
         (c) => c.financialSpaceId === financialSpaceId && c.name.toLowerCase() === name.toLowerCase()
       ) ??
      null
    )
  }

  async create(category: Category) {
    this.items.push(category)
    return category
  }

  async createMany(categories: Category[]) {
    this.items.push(...categories)
    return categories
  }

  async update(category: Category) {
    const index = this.items.findIndex((c) => c.id === category.id)
    if (index >= 0) this.items[index] = category
    return category
  }

  async delete(id: string) {
    this.items = this.items.filter((c) => c.id !== id)
  }

  async hasTransactions(_id: string) {
    return false
  }
}

export class InMemoryBudgetRepository implements IBudgetRepository {
  items: Budget[] = []

  async findById(id: string) {
    return this.items.find((b) => b.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((b) => b.financialSpaceId === financialSpaceId)
  }

  async create(budget: Budget) {
    this.items.push(budget)
    return budget
  }

  async update(budget: Budget) {
    const index = this.items.findIndex((b) => b.id === budget.id)
    if (index >= 0) this.items[index] = budget
    return budget
  }

  async delete(id: string) {
    this.items = this.items.filter((b) => b.id !== id)
  }
}

export class InMemoryGoalRepository implements IGoalRepository {
  items: Goal[] = []

  async findById(id: string) {
    return this.items.find((g) => g.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((g) => g.financialSpaceId === financialSpaceId)
  }

  async create(goal: Goal) {
    this.items.push(goal)
    return goal
  }

  async update(goal: Goal) {
    const index = this.items.findIndex((g) => g.id === goal.id)
    if (index >= 0) this.items[index] = goal
    return goal
  }

  async delete(id: string) {
    this.items = this.items.filter((g) => g.id !== id)
  }
}

export class InMemoryRecurringRepository implements IRecurringRepository {
  items: RecurringTransaction[] = []

  async findById(id: string) {
    return this.items.find((r) => r.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((r) => r.financialSpaceId === financialSpaceId)
  }

  async findDue(reference: Date) {
    return this.items.filter((r) => r.isDue(reference))
  }

  async create(recurring: RecurringTransaction) {
    this.items.push(recurring)
    return recurring
  }

  async update(recurring: RecurringTransaction) {
    const index = this.items.findIndex((r) => r.id === recurring.id)
    if (index >= 0) this.items[index] = recurring
    return recurring
  }

  async delete(id: string) {
    this.items = this.items.filter((r) => r.id !== id)
  }
}

export class InMemoryPlanItemRepository implements IPlanItemRepository {
  items: PlanItem[] = []

  async findById(id: string) {
    return this.items.find((item) => item.id === id) ?? null
  }

  async findByFinancialSpaceId(financialSpaceId: string) {
    return this.items.filter((item) => item.financialSpaceId === financialSpaceId)
  }

  async create(planItem: PlanItem) {
    this.items.push(planItem)
    return planItem
  }

  async update(planItem: PlanItem) {
    const index = this.items.findIndex((item) => item.id === planItem.id)
    if (index >= 0) this.items[index] = planItem
    return planItem
  }

  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id)
  }
}

/** Convenience factory: a full set of in-memory repos for tests. */
export function makeInMemoryDeps() {
  const accountRepo = new InMemoryAccountRepository()
  return {
    transactionRepo: new InMemoryTransactionRepository(),
    accountRepo,
    creditCardProfileRepo: new InMemoryCreditCardProfileRepository(accountRepo),
    categoryRepo: new InMemoryCategoryRepository(),
    budgetRepo: new InMemoryBudgetRepository(),
    goalRepo: new InMemoryGoalRepository(),
    recurringRepo: new InMemoryRecurringRepository(),
    planItemRepo: new InMemoryPlanItemRepository(),
    loanRepo: new InMemoryLoanRepository(),
  }
}
