import { createAssetSchema, createAssetValuationSchema } from '@finance/shared'
import { makeCreateAsset, makeGetAssets, makeRecordAssetValuation } from '@finance/domain'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { container } from '../../lib/container'
import { toAssetDto, toAssetValuationDto } from '../../lib/dto'
import { requireSession } from '../../middleware/session'

const assetsRoutes = new Hono().use('*', requireSession)

assetsRoutes.get('/', async (c) => c.json({ data: (await makeGetAssets({ assetRepo: container.assetRepo })(c.get('financialSpaceId'))).map(toAssetDto) }))
assetsRoutes.post('/', zValidator('json', createAssetSchema), async (c) => {
  const asset = await makeCreateAsset({ assetRepo: container.assetRepo })(c.get('financialSpaceId'), c.req.valid('json'))
  return c.json({ data: toAssetDto(asset) }, 201)
})
assetsRoutes.get('/:id/valuations', async (c) => {
  const asset = await container.assetRepo.findById(c.req.param('id'))
  if (!asset || asset.financialSpaceId !== c.get('financialSpaceId')) return c.json({ error: 'Activo no encontrado', code: 'NOT_FOUND' }, 404)
  return c.json({ data: (await container.assetRepo.findValuationsByAssetId(asset.id)).map(toAssetValuationDto) })
})
assetsRoutes.post('/:id/valuations', zValidator('json', createAssetValuationSchema), async (c) => {
  const result = await makeRecordAssetValuation({ assetRepo: container.assetRepo })(c.get('financialSpaceId'), c.req.param('id'), c.req.valid('json'))
  return c.json({ data: { asset: toAssetDto(result.asset), valuation: toAssetValuationDto(result.valuation) } }, 201)
})

export { assetsRoutes }
