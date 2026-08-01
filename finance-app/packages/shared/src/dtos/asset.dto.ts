import type { AssetType } from '../types'

export interface AssetDto {
  id: string
  financialSpaceId: string
  name: string
  type: AssetType
  currentValue: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetValuationDto {
  id: string
  assetId: string
  value: number
  date: string
  notes: string | null
  createdAt: string
}

export interface NetWorthDto {
  assets: number
  liabilities: number
  netWorth: number
}
