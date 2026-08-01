import type { FinancialSpace, FinancialSpaceMember } from '../../entities'

export interface IFinancialSpaceRepository {
  findById(id: string): Promise<FinancialSpace | null>
  findByUserId(userId: string): Promise<FinancialSpace[]>
  create(financialSpace: FinancialSpace): Promise<FinancialSpace>
  update(financialSpace: FinancialSpace): Promise<FinancialSpace>
  delete(id: string): Promise<void>
}

export interface IFinancialSpaceMemberRepository {
  findByFinancialSpaceId(financialSpaceId: string): Promise<FinancialSpaceMember[]>
  findByFinancialSpaceIdAndUserId(
    financialSpaceId: string,
    userId: string
  ): Promise<FinancialSpaceMember | null>
  create(member: FinancialSpaceMember): Promise<FinancialSpaceMember>
  delete(financialSpaceId: string, userId: string): Promise<void>
}
