import type {
  FinancialSpace,
  FinancialSpaceMember,
  IFinancialSpaceMemberRepository,
  IFinancialSpaceRepository,
} from "@finance/domain"
import type { PrismaClient } from "../client"
import {
  toDomainFinancialSpaceMember,
  toDomainFinancialSpace,
} from "../mapper"

export class PrismaFinancialSpaceRepository implements IFinancialSpaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<FinancialSpace | null> {
    const row = await this.prisma.financialSpace.findUnique({ where: { id } })
    return row ? toDomainFinancialSpace(row) : null
  }

  async findByUserId(userId: string): Promise<FinancialSpace[]> {
    const rows = await this.prisma.financialSpace.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "asc" },
    })
    return rows.map(toDomainFinancialSpace)
  }

  async create(financialSpace: FinancialSpace): Promise<FinancialSpace> {
    const row = await this.prisma.financialSpace.create({
      data: {
        id: financialSpace.id,
        name: financialSpace.name,
        type: financialSpace.type,
        createdAt: financialSpace.createdAt,
        updatedAt: financialSpace.updatedAt,
      },
    })
    return toDomainFinancialSpace(row)
  }

  async update(financialSpace: FinancialSpace): Promise<FinancialSpace> {
    const row = await this.prisma.financialSpace.update({
      where: { id: financialSpace.id },
      data: {
        name: financialSpace.name,
        updatedAt: financialSpace.updatedAt,
      },
    })
    return toDomainFinancialSpace(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.financialSpace.delete({ where: { id } })
  }
}

/** Persistence adapter for financial-space membership. */
export class PrismaFinancialSpaceMemberRepository implements IFinancialSpaceMemberRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByFinancialSpaceId(financialSpaceId: string): Promise<FinancialSpaceMember[]> {
    const rows = await this.prisma.financialSpaceMember.findMany({
      where: { financialSpaceId },
      orderBy: { createdAt: "asc" },
    })
    return rows.map(toDomainFinancialSpaceMember)
  }

  async findByFinancialSpaceIdAndUserId(
    financialSpaceId: string,
    userId: string,
  ): Promise<FinancialSpaceMember | null> {
    const row = await this.prisma.financialSpaceMember.findUnique({
      where: { financialSpaceId_userId: { financialSpaceId, userId } },
    })
    return row ? toDomainFinancialSpaceMember(row) : null
  }

  async create(member: FinancialSpaceMember): Promise<FinancialSpaceMember> {
    const row = await this.prisma.financialSpaceMember.create({
      data: {
        financialSpaceId: member.financialSpaceId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
      },
    })
    return toDomainFinancialSpaceMember(row)
  }

  async delete(financialSpaceId: string, userId: string): Promise<void> {
    await this.prisma.financialSpaceMember.delete({
      where: { financialSpaceId_userId: { financialSpaceId, userId } },
    })
  }
}
