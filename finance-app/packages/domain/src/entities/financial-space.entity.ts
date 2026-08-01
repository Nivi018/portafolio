import { ValidationException } from '../exceptions'
import type { FinancialSpaceType } from '@finance/shared'

export interface FinancialSpaceProps {
  id: string
  name: string
  type: FinancialSpaceType
  createdAt: Date
  updatedAt: Date
}

export interface CreateFinancialSpaceData {
  name: string
  type: FinancialSpaceType
}

export class FinancialSpace {
  private constructor(private props: FinancialSpaceProps) {}

  static create(data: CreateFinancialSpaceData): FinancialSpace {
    if (!data.name.trim()) {
      throw new ValidationException('El nombre del espacio financiero es requerido')
    }
    const now = new Date()
    return new FinancialSpace({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      type: data.type,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: FinancialSpaceProps): FinancialSpace {
    return new FinancialSpace(props)
  }

  get id(): string {
    return this.props.id
  }
  get name(): string {
    return this.props.name
  }
  get type(): FinancialSpaceType {
    return this.props.type
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  rename(name: string): void {
    if (!name.trim()) {
      throw new ValidationException('El nombre del espacio financiero es requerido')
    }
    this.props.name = name.trim()
    this.props.updatedAt = new Date()
  }
}
