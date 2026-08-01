import type { FinancialSpaceMemberRole } from '@finance/shared'

export interface FinancialSpaceMemberProps {
  financialSpaceId: string
  userId: string
  role: FinancialSpaceMemberRole
  createdAt: Date
}

export interface CreateFinancialSpaceMemberData {
  financialSpaceId: string
  userId: string
  role: FinancialSpaceMemberRole
}

export class FinancialSpaceMember {
  private constructor(private readonly props: FinancialSpaceMemberProps) {}

  static create(data: CreateFinancialSpaceMemberData): FinancialSpaceMember {
    return new FinancialSpaceMember({ ...data, createdAt: new Date() })
  }

  static reconstitute(props: FinancialSpaceMemberProps): FinancialSpaceMember {
    return new FinancialSpaceMember(props)
  }

  get financialSpaceId(): string {
    return this.props.financialSpaceId
  }
  get userId(): string {
    return this.props.userId
  }
  get role(): FinancialSpaceMemberRole {
    return this.props.role
  }
  get createdAt(): Date {
    return this.props.createdAt
  }

  isOwner(): boolean {
    return this.props.role === 'OWNER'
  }
}
