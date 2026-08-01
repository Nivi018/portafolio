import type { CategoryType } from "@finance/shared"
import type { ICategoryRepository, Category } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainCategory } from "../mapper"

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } })
    return row ? toDomainCategory(row) : null
  }

  async findByFinancialSpaceId(financialSpaceId: string): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { financialSpaceId },
      orderBy: { name: "asc" },
    })
    return rows.map(toDomainCategory)
  }

  async findByFinancialSpaceIdAndType(financialSpaceId: string, type: CategoryType): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { financialSpaceId, type },
      orderBy: { name: "asc" },
    })
    return rows.map(toDomainCategory)
  }

  async findByName(financialSpaceId: string, name: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { financialSpaceId, name: { equals: name, mode: "insensitive" } },
    })
    return row ? toDomainCategory(row) : null
  }

  async create(category: Category): Promise<Category> {
    const row = await this.prisma.category.create({
      data: {
        id: category.id,
        financialSpaceId: category.financialSpaceId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        createdAt: category.createdAt,
      },
    })
    return toDomainCategory(row)
  }

  async createMany(categories: Category[]): Promise<Category[]> {
    const rows = await this.prisma.category.createManyAndReturn({
      data: categories.map((c) => ({
        id: c.id,
        financialSpaceId: c.financialSpaceId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        createdAt: c.createdAt,
      })),
    })
    return rows.map(toDomainCategory)
  }

  async update(category: Category): Promise<Category> {
    const row = await this.prisma.category.update({
      where: { id: category.id },
      data: {
        name: category.name,
        icon: category.icon,
        color: category.color,
      },
    })
    return toDomainCategory(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } })
  }

  async hasTransactions(id: string): Promise<boolean> {
    const count = await this.prisma.transaction.count({ where: { categoryId: id } })
    return count > 0
  }
}
