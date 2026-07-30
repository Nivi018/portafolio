import type { IBudgetRepository, Budget } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainBudget } from "../mapper"

export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Budget | null> {
    const row = await this.prisma.budget.findUnique({ where: { id } })
    return row ? toDomainBudget(row) : null
  }

  async findByUserId(userId: string): Promise<Budget[]> {
    const rows = await this.prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(toDomainBudget)
  }

  async create(budget: Budget): Promise<Budget> {
    const row = await this.prisma.budget.create({
      data: {
        id: budget.id,
        userId: budget.userId,
        amount: budget.amount,
        period: budget.period,
        categoryId: budget.categoryId,
        startDate: budget.startDate,
        createdAt: budget.createdAt,
      },
    })
    return toDomainBudget(row)
  }

  async update(budget: Budget): Promise<Budget> {
    const row = await this.prisma.budget.update({
      where: { id: budget.id },
      data: {
        amount: budget.amount,
        period: budget.period,
        categoryId: budget.categoryId,
      },
    })
    return toDomainBudget(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.budget.delete({ where: { id } })
  }
}
