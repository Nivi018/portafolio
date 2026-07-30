/**
 * DateRange value object with common range factories.
 * Used by filters, reports, and budget period calculations.
 */
export class DateRange {
  private constructor(
    public readonly from: Date,
    public readonly to: Date
  ) {}

  static of(from: Date, to: Date): DateRange {
    return new DateRange(startOfDay(from), endOfDay(to))
  }

  /** Current calendar month containing the reference date. */
  static currentMonth(reference: Date = new Date()): DateRange {
    const from = new Date(reference.getFullYear(), reference.getMonth(), 1)
    const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
    return DateRange.of(from, to)
  }

  /** Previous calendar month relative to the reference date. */
  static previousMonth(reference: Date = new Date()): DateRange {
    const from = new Date(reference.getFullYear(), reference.getMonth() - 1, 1)
    const to = new Date(reference.getFullYear(), reference.getMonth(), 0)
    return DateRange.of(from, to)
  }

  /** Current ISO week (Monday to Sunday) containing the reference date. */
  static currentWeek(reference: Date = new Date()): DateRange {
    const day = reference.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(reference)
    monday.setDate(reference.getDate() + diffToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return DateRange.of(monday, sunday)
  }

  /** Current calendar year containing the reference date. */
  static currentYear(reference: Date = new Date()): DateRange {
    return DateRange.of(
      new Date(reference.getFullYear(), 0, 1),
      new Date(reference.getFullYear(), 11, 31)
    )
  }

  contains(date: Date): boolean {
    return date >= this.from && date <= this.to
  }
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
