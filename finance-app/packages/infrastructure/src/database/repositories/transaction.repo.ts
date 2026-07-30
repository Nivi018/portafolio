import type { TransactionType } from "@finance/shared"
import type {
  ITransactionRepository,
  TransactionFilters,
  PaginatedResult,
  TransactionSummary,
  CategoryTotal,
  MonthlyFlowPoint,
  Transaction,
  DateRange,
} from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainTransaction } from "../mapper"

/**
 * Prisma adapter implementing the ITransactionRepository port.
 */
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Transaction | null> {
    const row = await this.prisma.transaction.findUnique({ where: { id } })
    return row ? toDomainTransaction(row) : null
  }

  async findByUserId(
    userId: string,
    filters: TransactionFilters
  ): Promise<PaginatedResult<Transaction>> {
    const where = {
      userId,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.from || filters.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
      ...(filters.search ? { description: { contains: filters.search, mode: "insensitive" as const } } : {}),
    }

    const [rows, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.transaction.count({ where }),
    ])

    return { items: rows.map(toDomainTransaction), total }
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const row = await this.prisma.transaction.create({
      data: {
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date,
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
        userId: transaction.userId,
        recurringId: transaction.recurringId,
        createdAt: transaction.createdAt,
      },
    })
    return toDomainTransaction(row)
  }

  async update(transaction: Transaction): Promise<Transaction> {
    const row = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        amount: transaction.amount,
        description: transaction.description,
        type: transaction.type,
        date: transaction.date,
        categoryId: transaction.categoryId,
        accountId: transaction.accountId,
      },
    })
    return toDomainTransaction(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({ where: { id } })
  }

  async getSummary(userId: string, range: DateRange): Promise<TransactionSummary> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ["type"],
      where: { userId, date: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
      _count: { _all: true },
    })

    let totalIncome = 0
    let totalExpense = 0
    let transactionCount = 0

    for (const group of grouped) {
      const sum = group._sum.amount ?? 0
      transactionCount += group._count._all
      if (group.type === "INCOME") totalIncome = sum
      else if (group.type === "EXPENSE") totalExpense = sum
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount,
    }
  }

  async getCategoryTotals(
    userId: string,
    range: DateRange,
    type: TransactionType
  ): Promise<CategoryTotal[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type,
        categoryId: { not: null },
        date: { gte: range.from, lte: range.to },
      },
      _sum: { amount: true },
    })

    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null)

    if (categoryIds.length === 0) return []

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true },
    })
    const byId = new Map(categories.map((c) => [c.id, c]))

    return grouped
      .map((g) => {
        const category = byId.get(g.categoryId as string)
        if (!category) return null
        return {
          categoryId: category.id,
          categoryName: category.name,
          color: category.color,
          icon: category.icon,
          total: g._sum.amount ?? 0,
        }
      })
      .filter((c): c is CategoryTotal => c !== null)
      .sort((a, b) => b.total - a.total)
  }

  async getMonthlyFlow(userId: string, months: number): Promise<MonthlyFlowPoint[]> {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

    const rows = await this.prisma.$queryRaw<
      Array<{ month: string; income: number; expense: number }>
    >`
      SELECT
        to_char(t."date", 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN t."type" = 'INCOME' THEN t."amount" END), 0)::float AS income,
        COALESCE(SUM(CASE WHEN t."type" = 'EXPENSE' THEN t."amount" END), 0)::float AS expense
      FROM "transaction" t
      WHERE t."userId" = ${userId} AND t."date" >= ${from}
      GROUP BY 1
      ORDER BY 1
    `

    // Fill months with no activity with zeros so charts render continuously
    const byMonth = new Map(rows.map((r) => [r.month, r]))
    const result: MonthlyFlowPoint[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const row = byMonth.get(key)
      result.push({ month: key, income: row?.income ?? 0, expense: row?.expense ?? 0 })
    }
    return result
  }

  async getRecentByUserId(userId: string, limit: number): Promise<Transaction[]> {
    const rows = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: limit,
    })
    return rows.map(toDomainTransaction)
  }

  async getTotalSpent(userId: string, range: DateRange, categoryId?: string): Promise<number> {
    const agg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: range.from, lte: range.to },
        ...(categoryId ? { categoryId } : {}),
      },
      _sum: { amount: true },
    })
    return agg._sum.amount ?? 0
  }
}
