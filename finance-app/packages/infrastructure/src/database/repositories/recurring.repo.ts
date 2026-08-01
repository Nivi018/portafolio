import type { IRecurringRepository, RecurringTransaction } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainRecurring } from "../mapper"

export class PrismaRecurringRepository implements IRecurringRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RecurringTransaction | null> {
    const row = await this.prisma.recurringTransaction.findUnique({ where: { id } })
    return row ? toDomainRecurring(row) : null
  }

  async findByFinancialSpaceId(financialSpaceId: string): Promise<RecurringTransaction[]> {
    const rows = await this.prisma.recurringTransaction.findMany({
      where: { financialSpaceId },
      orderBy: { nextDueDate: "asc" },
    })
    return rows.map(toDomainRecurring)
  }

  async findDue(reference: Date): Promise<RecurringTransaction[]> {
    const rows = await this.prisma.recurringTransaction.findMany({
      where: { active: true, nextDueDate: { lte: reference } },
    })
    return rows.map(toDomainRecurring)
  }

  async create(recurring: RecurringTransaction): Promise<RecurringTransaction> {
    const row = await this.prisma.recurringTransaction.create({
      data: {
        id: recurring.id,
        financialSpaceId: recurring.financialSpaceId,
        amount: recurring.amount,
        description: recurring.description,
        type: recurring.type,
        frequency: recurring.frequency,
        nextDueDate: recurring.nextDueDate,
        categoryId: recurring.categoryId,
        accountId: recurring.accountId,
        active: recurring.active,
        createdAt: recurring.createdAt,
      },
    })
    return toDomainRecurring(row)
  }

  async update(recurring: RecurringTransaction): Promise<RecurringTransaction> {
    const row = await this.prisma.recurringTransaction.update({
      where: { id: recurring.id },
      data: {
        amount: recurring.amount,
        description: recurring.description,
        type: recurring.type,
        frequency: recurring.frequency,
        nextDueDate: recurring.nextDueDate,
        active: recurring.active,
      },
    })
    return toDomainRecurring(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recurringTransaction.delete({ where: { id } })
  }
}
