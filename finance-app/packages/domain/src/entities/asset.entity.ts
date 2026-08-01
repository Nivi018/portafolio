import type { AssetType } from '@finance/shared'
import { ValidationException } from '../exceptions'
import { Money } from '../value-objects'

export interface AssetProps {
  id: string
  financialSpaceId: string
  name: string
  type: AssetType
  currentValue: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateAssetData {
  financialSpaceId: string
  name: string
  type: AssetType
  currentValue: number
  notes?: string
}

export class Asset {
  private constructor(private props: AssetProps) {}

  static create(data: CreateAssetData): Asset {
    if (!data.name.trim()) throw new ValidationException('El nombre del activo es requerido')
    const now = new Date()
    return new Asset({
      id: crypto.randomUUID(), financialSpaceId: data.financialSpaceId, name: data.name.trim(),
      type: data.type, currentValue: Money.of(data.currentValue).amount, notes: data.notes?.trim() || null,
      createdAt: now, updatedAt: now,
    })
  }

  static reconstitute(props: AssetProps): Asset { return new Asset(props) }
  get id() { return this.props.id }
  get financialSpaceId() { return this.props.financialSpaceId }
  get name() { return this.props.name }
  get type() { return this.props.type }
  get currentValue() { return this.props.currentValue }
  get notes() { return this.props.notes }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  updateValue(value: number): void {
    this.props.currentValue = Money.of(value).amount
    this.props.updatedAt = new Date()
  }
}

export interface AssetValuationProps {
  id: string
  assetId: string
  value: number
  date: Date
  notes: string | null
  createdAt: Date
}

export class AssetValuation {
  private constructor(private props: AssetValuationProps) {}
  static create(data: Omit<AssetValuationProps, 'id' | 'createdAt'>): AssetValuation {
    if (!(data.date instanceof Date) || Number.isNaN(data.date.getTime())) throw new ValidationException('La fecha de valuación no es válida')
    return new AssetValuation({ ...data, id: crypto.randomUUID(), value: Money.of(data.value).amount, createdAt: new Date() })
  }
  static reconstitute(props: AssetValuationProps): AssetValuation { return new AssetValuation(props) }
  get id() { return this.props.id }
  get assetId() { return this.props.assetId }
  get value() { return this.props.value }
  get date() { return this.props.date }
  get notes() { return this.props.notes }
  get createdAt() { return this.props.createdAt }
}
