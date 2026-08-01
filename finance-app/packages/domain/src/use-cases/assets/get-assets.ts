import type { IAssetRepository } from '../../ports'

export function makeGetAssets({ assetRepo }: { assetRepo: IAssetRepository }) {
  return (financialSpaceId: string) => assetRepo.findByFinancialSpaceId(financialSpaceId)
}
