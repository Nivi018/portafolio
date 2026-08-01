import type { Asset, AssetValuation } from '../../entities'

export interface IAssetRepository {
  findById(id: string): Promise<Asset | null>
  findByFinancialSpaceId(financialSpaceId: string): Promise<Asset[]>
  findValuationsByAssetId(assetId: string): Promise<AssetValuation[]>
  create(asset: Asset): Promise<Asset>
  update(asset: Asset): Promise<Asset>
  createValuation(valuation: AssetValuation): Promise<AssetValuation>
}
