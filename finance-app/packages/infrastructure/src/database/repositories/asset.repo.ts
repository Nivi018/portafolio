import type { Asset, AssetValuation, IAssetRepository } from '@finance/domain'
import type { PrismaClient } from '../client'
import { toDomainAsset, toDomainAssetValuation } from '../mapper'

export class PrismaAssetRepository implements IAssetRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async findById(id: string) { const row = await this.prisma.asset.findUnique({ where: { id } }); return row ? toDomainAsset(row) : null }
  async findByFinancialSpaceId(financialSpaceId: string) { const rows = await this.prisma.asset.findMany({ where: { financialSpaceId }, orderBy: { createdAt: 'desc' } }); return rows.map(toDomainAsset) }
  async findValuationsByAssetId(assetId: string) { const rows = await this.prisma.assetValuation.findMany({ where: { assetId }, orderBy: { date: 'desc' } }); return rows.map(toDomainAssetValuation) }
  async create(asset: Asset) { const row = await this.prisma.asset.create({ data: { id: asset.id, financialSpaceId: asset.financialSpaceId, name: asset.name, type: asset.type, currentValue: asset.currentValue, notes: asset.notes, createdAt: asset.createdAt, updatedAt: asset.updatedAt } }); return toDomainAsset(row) }
  async update(asset: Asset) { const row = await this.prisma.asset.update({ where: { id: asset.id }, data: { name: asset.name, type: asset.type, currentValue: asset.currentValue, notes: asset.notes, updatedAt: asset.updatedAt } }); return toDomainAsset(row) }
  async createValuation(valuation: AssetValuation) { const row = await this.prisma.assetValuation.create({ data: { id: valuation.id, assetId: valuation.assetId, value: valuation.value, date: valuation.date, notes: valuation.notes, createdAt: valuation.createdAt } }); return toDomainAssetValuation(row) }
}
