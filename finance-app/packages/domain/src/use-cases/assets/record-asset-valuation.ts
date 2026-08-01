import type { CreateAssetValuationInput } from '@finance/shared'
import { AssetValuation } from '../../entities'
import { NotFoundException } from '../../exceptions'
import type { IAssetRepository } from '../../ports'

export function makeRecordAssetValuation({ assetRepo }: { assetRepo: IAssetRepository }) {
  return async (financialSpaceId: string, assetId: string, input: CreateAssetValuationInput) => {
    const asset = await assetRepo.findById(assetId)
    if (!asset || asset.financialSpaceId !== financialSpaceId) throw new NotFoundException('Activo no encontrado')
    asset.updateValue(input.value)
    const valuation = AssetValuation.create({ assetId, ...input, notes: input.notes?.trim() || null })
    await assetRepo.update(asset)
    return { asset, valuation: await assetRepo.createValuation(valuation) }
  }
}
