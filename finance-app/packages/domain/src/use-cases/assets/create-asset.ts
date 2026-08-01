import type { CreateAssetInput } from '@finance/shared'
import { Asset } from '../../entities'
import type { IAssetRepository } from '../../ports'

export function makeCreateAsset({ assetRepo }: { assetRepo: IAssetRepository }) {
  return (financialSpaceId: string, input: CreateAssetInput) => assetRepo.create(Asset.create({ ...input, financialSpaceId }))
}
