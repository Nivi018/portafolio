import type { IPlanItemRepository, PlanItem } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainPlanItem } from "../mapper"

export class PrismaPlanItemRepository implements IPlanItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<PlanItem | null> {
    const row = await this.prisma.planItem.findUnique({ where: { id } })
    return row ? toDomainPlanItem(row) : null
  }

  async findByFinancialSpaceId(financialSpaceId: string): Promise<PlanItem[]> {
    const rows = await this.prisma.planItem.findMany({
      where: { financialSpaceId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(toDomainPlanItem)
  }

  async create(planItem: PlanItem): Promise<PlanItem> {
    const row = await this.prisma.planItem.create({
      data: {
        id: planItem.id,
        financialSpaceId: planItem.financialSpaceId,
        name: planItem.name,
        amount: planItem.amount,
        type: planItem.type,
        frequency: planItem.frequency,
        categoryId: planItem.categoryId,
        accountId: planItem.accountId,
        isFixed: planItem.isFixed,
        isMicroExpense: planItem.isMicroExpense,
        createdAt: planItem.createdAt,
        updatedAt: planItem.updatedAt,
      },
    })
    return toDomainPlanItem(row)
  }

  async update(planItem: PlanItem): Promise<PlanItem> {
    const row = await this.prisma.planItem.update({
      where: { id: planItem.id },
      data: {
        name: planItem.name,
        amount: planItem.amount,
        type: planItem.type,
        frequency: planItem.frequency,
        categoryId: planItem.categoryId,
        accountId: planItem.accountId,
        isFixed: planItem.isFixed,
        isMicroExpense: planItem.isMicroExpense,
      },
    })
    return toDomainPlanItem(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.planItem.delete({ where: { id } })
  }
}
