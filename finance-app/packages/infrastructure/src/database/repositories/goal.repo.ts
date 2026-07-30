import type { IGoalRepository, Goal } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainGoal } from "../mapper"

export class PrismaGoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Goal | null> {
    const row = await this.prisma.goal.findUnique({ where: { id } })
    return row ? toDomainGoal(row) : null
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(toDomainGoal)
  }

  async create(goal: Goal): Promise<Goal> {
    const row = await this.prisma.goal.create({
      data: {
        id: goal.id,
        userId: goal.userId,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
        createdAt: goal.createdAt,
      },
    })
    return toDomainGoal(row)
  }

  async update(goal: Goal): Promise<Goal> {
    const row = await this.prisma.goal.update({
      where: { id: goal.id },
      data: {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        deadline: goal.deadline,
      },
    })
    return toDomainGoal(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.goal.delete({ where: { id } })
  }
}
