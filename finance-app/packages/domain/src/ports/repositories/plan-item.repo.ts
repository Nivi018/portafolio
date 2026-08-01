import type { PlanItem } from '../../entities'

export interface IPlanItemRepository {
  findById(id: string): Promise<PlanItem | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<PlanItem[]>
  create(planItem: PlanItem): Promise<PlanItem>
  update(planItem: PlanItem): Promise<PlanItem>
  delete(id: string): Promise<void>
}
