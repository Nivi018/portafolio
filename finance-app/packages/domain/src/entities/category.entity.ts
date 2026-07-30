import type { CategoryType } from '@finance/shared'
import { ValidationException } from '../exceptions'

export interface CategoryProps {
  id: string
  userId: string
  name: string
  icon: string
  color: string
  type: CategoryType
  createdAt: Date
}

export interface CreateCategoryData {
  name: string
  icon: string
  color: string
  type: CategoryType
  userId: string
}

/**
 * Category entity. Each user has their own set of categories.
 */
export class Category {
  private constructor(private props: CategoryProps) {}

  static create(data: CreateCategoryData): Category {
    if (!data.name.trim()) {
      throw new ValidationException('El nombre de la categoría es requerido')
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(data.color)) {
      throw new ValidationException('El color debe ser hexadecimal válido (#rrggbb)')
    }
    return new Category({
      id: crypto.randomUUID(),
      userId: data.userId,
      name: data.name.trim(),
      icon: data.icon,
      color: data.color.toLowerCase(),
      type: data.type,
      createdAt: new Date(),
    })
  }

  static reconstitute(props: CategoryProps): Category {
    return new Category(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get name(): string {
    return this.props.name
  }
  get icon(): string {
    return this.props.icon
  }
  get color(): string {
    return this.props.color
  }
  get type(): CategoryType {
    return this.props.type
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  update(data: Partial<Pick<CategoryProps, 'name' | 'icon' | 'color'>>): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) throw new ValidationException('El nombre es requerido')
      this.props.name = data.name.trim()
    }
    if (data.icon !== undefined) this.props.icon = data.icon
    if (data.color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(data.color)) {
        throw new ValidationException('El color debe ser hexadecimal válido (#rrggbb)')
      }
      this.props.color = data.color.toLowerCase()
    }
  }
}
