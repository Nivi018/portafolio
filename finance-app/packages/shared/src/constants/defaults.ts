/**
 * Application-wide default values and limits.
 */

export const DEFAULT_CURRENCY = 'MXN'

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const VALIDATION_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  SEARCH_MAX: 100,
  NOTE_MAX: 1000,
} as const

/**
 * Default categories created for new users.
 * Icons reference lucide-react icon names.
 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentación', icon: 'utensils', color: '#f97316' },
  { name: 'Transporte', icon: 'car', color: '#3b82f6' },
  { name: 'Vivienda', icon: 'home', color: '#8b5cf6' },
  { name: 'Servicios', icon: 'zap', color: '#eab308' },
  { name: 'Salud', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Entretenimiento', icon: 'gamepad-2', color: '#ec4899' },
  { name: 'Educación', icon: 'graduation-cap', color: '#06b6d4' },
  { name: 'Compras', icon: 'shopping-bag', color: '#84cc16' },
  { name: 'Otros gastos', icon: 'circle-dollar-sign', color: '#6b7280' },
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salario', icon: 'briefcase', color: '#22c55e' },
  { name: 'Freelance', icon: 'laptop', color: '#10b981' },
  { name: 'Inversiones', icon: 'trending-up', color: '#14b8a6' },
  { name: 'Otros ingresos', icon: 'plus-circle', color: '#65a30d' },
] as const
