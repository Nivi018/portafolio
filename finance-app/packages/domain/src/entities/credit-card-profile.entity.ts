import { ValidationException } from '../exceptions'

export interface CreditCardProfileProps {
  id: string
  accountId: string
  bank: string
  product: string
  creditLimit: number
  apr: number
  statementCloseDay: number
  paymentDueDay: number
  createdAt: Date
  updatedAt: Date
}

export type CreateCreditCardProfileData = Omit<CreditCardProfileProps, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCreditCardProfileData = Partial<Omit<CreateCreditCardProfileData, 'accountId'>>

/**
 * Credit-card terms. The account association is immutable so one profile
 * always describes the same CREDIT account.
 */
export class CreditCardProfile {
  private constructor(private props: CreditCardProfileProps) {}

  static create(data: CreateCreditCardProfileData): CreditCardProfile {
    CreditCardProfile.validate(data)
    const now = new Date()
    return new CreditCardProfile({ id: crypto.randomUUID(), ...CreditCardProfile.normalize(data), createdAt: now, updatedAt: now })
  }

  static reconstitute(props: CreditCardProfileProps): CreditCardProfile {
    return new CreditCardProfile(props)
  }

  get id(): string { return this.props.id }
  get accountId(): string { return this.props.accountId }
  get bank(): string { return this.props.bank }
  get product(): string { return this.props.product }
  get creditLimit(): number { return this.props.creditLimit }
  get apr(): number { return this.props.apr }
  get statementCloseDay(): number { return this.props.statementCloseDay }
  get paymentDueDay(): number { return this.props.paymentDueDay }
  get createdAt(): Date { return this.props.createdAt }
  get updatedAt(): Date { return this.props.updatedAt }

  update(data: UpdateCreditCardProfileData): void {
    const next = { ...this.props, ...data }
    CreditCardProfile.validate(next)
    Object.assign(this.props, CreditCardProfile.normalize(next), { updatedAt: new Date() })
  }

  private static normalize<T extends Pick<CreditCardProfileProps, 'bank' | 'product'>>(data: T): T {
    return { ...data, bank: data.bank.trim(), product: data.product.trim() }
  }

  private static validate(data: Pick<CreditCardProfileProps, 'accountId' | 'bank' | 'product' | 'creditLimit' | 'apr' | 'statementCloseDay' | 'paymentDueDay'>): void {
    if (!data.accountId.trim()) throw new ValidationException('La cuenta de credito es requerida')
    if (!data.bank.trim()) throw new ValidationException('El banco es requerido')
    if (!data.product.trim()) throw new ValidationException('El producto es requerido')
    if (!Number.isFinite(data.creditLimit) || data.creditLimit <= 0) throw new ValidationException('El limite de credito debe ser positivo')
    if (!Number.isFinite(data.apr) || data.apr < 0) throw new ValidationException('La tasa APR no puede ser negativa')
    if (!Number.isInteger(data.statementCloseDay) || data.statementCloseDay < 1 || data.statementCloseDay > 31) throw new ValidationException('El dia de corte debe estar entre 1 y 31')
    if (!Number.isInteger(data.paymentDueDay) || data.paymentDueDay < 1 || data.paymentDueDay > 31) throw new ValidationException('El dia limite de pago debe estar entre 1 y 31')
  }
}
