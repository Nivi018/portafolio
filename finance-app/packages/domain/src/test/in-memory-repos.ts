import type { TransactionType, CategoryType } from '@finance/shared'
import type {
  Transaction,
  Account,
  Budget,
  Goal,
  Category,
  RecurringTransaction,
} from '../entities'
import type { DateRange } from '../value-objects'
import type {
  ITransactionRepository,
  IAccountRepository,
  IBudgetRepository,
  IGoalRepository,
  ICategoryRepository,
  IRecurringRepository,
  TransactionFilters,
  PaginatedResult,
  TransactionSummary,
  CategoryTotal,
  MonthlyFlowPoint,
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

  async findByUserId(
    userId: string,
    filters: TransactionFilters
  ): Promise<PaginatedResult<Transaction>> {
    let filtered = this.items.filter((t) => t.userId === userId)
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

  async getSummary(userId: string, range: DateRange): Promise<TransactionSummary> {
    const txs = this.items.filter((t) => t.userId === userId && range.contains(t.date))
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
    _userId: string,
    _range: DateRange,
    _type: TransactionType
  ): Promise<CategoryTotal[]> {
    return []
  }

  async getMonthlyFlow(_userId: string, _months: number): Promise<MonthlyFlowPoint[]> {
    return []
  }

  async getRecentByUserId(userId: string, limit: number) {
    return this.items
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
  }

  async getTotalSpent(userId: string, range: DateRange, categoryId?: string) {
    return this.items
      .filter(
        (t) =>
          t.userId === userId &&
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

  async findByUserId(userId: string) {
    return this.items.filter((a) => a.userId === userId)
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

  async getTotalBalance(userId: string) {
    return this.items.filter((a) => a.userId === userId).reduce((s, a) => s + a.balance, 0)
  }
}

export class InMemoryCategoryRepository implements ICategoryRepository {
  items: Category[] = []

  async findById(id: string) {
    return this.items.find((c) => c.id === id) ?? null
  }

  async findByUserId(userId: string) {
    return this.items.filter((c) => c.userId === userId)
  }

  async findByUserIdAndType(userId: string, type: CategoryType) {
    return this.items.filter((c) => c.userId === userId && c.type === type)
  }

  async findByName(userId: string, name: string) {
    return (
      this.items.find((c) => c.userId === userId && c.name.toLowerCase() === name.toLowerCase()) ??
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

  async findByUserId(userId: string) {
    return this.items.filter((b) => b.userId === userId)
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

  async findByUserId(userId: string) {
    return this.items.filter((g) => g.userId === userId)
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

  async findByUserId(userId: string) {
    return this.items.filter((r) => r.userId === userId)
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

/** Convenience factory: a full set of in-memory repos for tests. */
export function makeInMemoryDeps() {
  return {
    transactionRepo: new InMemoryTransactionRepository(),
    accountRepo: new InMemoryAccountRepository(),
    categoryRepo: new InMemoryCategoryRepository(),
    budgetRepo: new InMemoryBudgetRepository(),
    goalRepo: new InMemoryGoalRepository(),
    recurringRepo: new InMemoryRecurringRepository(),
  }
}
