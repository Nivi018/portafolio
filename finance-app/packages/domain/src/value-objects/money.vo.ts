import { ValidationException } from '../exceptions'

/**
 * Money value object.
 * Guarantees finite, 2-decimal rounded values and safe arithmetic.
 * Entities store plain numbers; Money is used for calculations in use cases.
 */
export class Money {
  private constructor(public readonly amount: number) {}

  static of(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new ValidationException('El monto debe ser un número válido')
    }
    return new Money(Math.round(amount * 100) / 100)
  }

  static zero(): Money {
    return new Money(0)
  }

  add(other: Money): Money {
    return Money.of(this.amount + other.amount)
  }

  subtract(other: Money): Money {
    return Money.of(this.amount - other.amount)
  }

  abs(): Money {
    return Money.of(Math.abs(this.amount))
  }

  isPositive(): boolean {
    return this.amount > 0
  }

  isNegative(): boolean {
    return this.amount < 0
  }

  isZero(): boolean {
    return this.amount === 0
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount
  }
}
