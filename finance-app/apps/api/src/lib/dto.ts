import type {
  AccountDto,
  AccountSummaryDto,
  AssetDto,
  AssetValuationDto,
  BudgetDto,
  BudgetStatusDto,
  CategoryDto,
  CategorySummaryDto,
  CreditCardProfileDto,
  DashboardDto,
  GoalWithProgressDto,
  LoanPaymentDto,
  LoanWithProgressDto,
  PlanItemDto,
  RecurringTransactionDto,
  TransactionDto,
  UserDto,
} from '@finance/shared'
import type {
  Account,
  Asset,
  AssetValuation,
  Budget,
  BudgetStatus,
  Category,
  CreditCardProfile,
  DashboardData,
  Goal,
  Loan,
  LoanPayment,
  PlanItem,
  RecurringTransaction,
  Transaction,
  User,
} from '@finance/domain'

const iso = (date: Date) => date.toISOString()

export function toUserDto(user: User): UserDto {
  return { id: user.id, name: user.name, email: user.email, image: user.image, createdAt: iso(user.createdAt) }
}

export function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    type: category.type,
    createdAt: iso(category.createdAt),
  }
}

export function toCategorySummaryDto(category: Category): CategorySummaryDto {
  return { id: category.id, name: category.name, icon: category.icon, color: category.color }
}

export function toAccountDto(account: Account): AccountDto {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
    createdAt: iso(account.createdAt),
    updatedAt: iso(account.updatedAt),
  }
}

export function toAccountSummaryDto(account: Account): AccountSummaryDto {
  return { id: account.id, name: account.name, type: account.type }
}

export function toAssetDto(asset: Asset): AssetDto {
  return { id: asset.id, financialSpaceId: asset.financialSpaceId, name: asset.name, type: asset.type, currentValue: asset.currentValue, notes: asset.notes, createdAt: iso(asset.createdAt), updatedAt: iso(asset.updatedAt) }
}

export function toAssetValuationDto(valuation: AssetValuation): AssetValuationDto {
  return { id: valuation.id, assetId: valuation.assetId, value: valuation.value, date: iso(valuation.date), notes: valuation.notes, createdAt: iso(valuation.createdAt) }
}

export function toCreditCardProfileDto(profile: CreditCardProfile): CreditCardProfileDto {
  return {
    id: profile.id,
    accountId: profile.accountId,
    bank: profile.bank,
    product: profile.product,
    creditLimit: profile.creditLimit,
    apr: profile.apr,
    statementCloseDay: profile.statementCloseDay,
    paymentDueDay: profile.paymentDueDay,
    createdAt: iso(profile.createdAt),
    updatedAt: iso(profile.updatedAt),
  }
}

export function toTransactionDto(
  transaction: Transaction,
  account: Account,
  category: Category | null
): TransactionDto {
  return {
    id: transaction.id,
    amount: transaction.amount,
    description: transaction.description,
    type: transaction.type,
    date: iso(transaction.date),
    category: category ? toCategorySummaryDto(category) : null,
    account: toAccountSummaryDto(account),
    createdAt: iso(transaction.createdAt),
  }
}

export function toBudgetDto(budget: Budget, category: Category | null): BudgetDto {
  return {
    id: budget.id,
    amount: budget.amount,
    period: budget.period,
    startDate: iso(budget.startDate),
    category: category ? toCategorySummaryDto(category) : null,
    createdAt: iso(budget.createdAt),
  }
}

export function toBudgetStatusDto(
  budget: Budget,
  status: BudgetStatus,
  category: Category | null
): BudgetStatusDto {
  return { ...toBudgetDto(budget, category), ...status }
}

export function toGoalDto(goal: Goal): GoalWithProgressDto {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    deadline: goal.deadline ? iso(goal.deadline) : null,
    expectedAnnualReturn: goal.expectedAnnualReturn,
    monthlyContributionTarget: goal.monthlyContributionTarget,
    status: goal.status,
    createdAt: iso(goal.createdAt),
    percentage: goal.getProgress(),
    remainingAmount: goal.getRemainingAmount(),
    daysRemaining: goal.getDaysRemaining(),
    monthsToDeadline: goal.getMonthsToDeadline(),
    projectedAmount: goal.getProjectedAmount(),
    requiredMonthlyContribution: goal.getRequiredMonthlyContribution(),
    projectionStatus: goal.getProjectionStatus(),
  }
}

export function toLoanDto(loan: Loan): LoanWithProgressDto {
  return {
    id: loan.id,
    financialSpaceId: loan.financialSpaceId,
    lender: loan.lender,
    name: loan.name,
    originalPrincipal: loan.originalPrincipal,
    currentBalance: loan.currentBalance,
    annualRate: loan.annualRate,
    termMonths: loan.termMonths,
    monthlyPayment: loan.monthlyPayment,
    startDate: iso(loan.startDate),
    nextPaymentDate: iso(loan.nextPaymentDate),
    createdAt: iso(loan.createdAt),
    updatedAt: iso(loan.updatedAt),
    progressPercentage: loan.getProgress(),
    estimatedTotalInterest: loan.getEstimatedTotalInterest(),
  }
}

export function toLoanPaymentDto(payment: LoanPayment): LoanPaymentDto {
  return {
    id: payment.id,
    loanId: payment.loanId,
    amount: payment.amount,
    date: iso(payment.date),
    transactionId: payment.transactionId,
    createdAt: iso(payment.createdAt),
  }
}

export function toPlanItemDto(planItem: PlanItem): PlanItemDto {
  return {
    id: planItem.id,
    name: planItem.name,
    amount: planItem.amount,
    type: planItem.type,
    frequency: planItem.frequency,
    categoryId: planItem.categoryId,
    accountId: planItem.accountId,
    isFixed: planItem.isFixed,
    isMicroExpense: planItem.isMicroExpense,
    monthlyEquivalent: planItem.monthlyEquivalent,
    yearlyEquivalent: planItem.yearlyEquivalent,
    createdAt: iso(planItem.createdAt),
    updatedAt: iso(planItem.updatedAt),
  }
}

export function toRecurringDto(
  recurring: RecurringTransaction,
  category: Category,
  account: Account
): RecurringTransactionDto {
  return {
    id: recurring.id,
    amount: recurring.amount,
    description: recurring.description,
    type: recurring.type,
    frequency: recurring.frequency,
    nextDueDate: iso(recurring.nextDueDate),
    active: recurring.active,
    category: toCategorySummaryDto(category),
    account: toAccountSummaryDto(account),
    createdAt: iso(recurring.createdAt),
  }
}

export async function toDashboardDto(
  dashboard: DashboardData,
  resolveTransaction: (transaction: Transaction) => Promise<TransactionDto>,
  resolveCategory: (categoryId: string | null) => Promise<Category | null>
): Promise<DashboardDto> {
  return {
    summary: {
      totalBalance: dashboard.totalBalance,
      monthlyIncome: dashboard.summary.totalIncome,
      monthlyExpense: dashboard.summary.totalExpense,
      monthlyNet: dashboard.summary.netBalance,
      incomeChangePercent: dashboard.incomeChangePercent,
      expenseChangePercent: dashboard.expenseChangePercent,
    },
    expensesByCategory: dashboard.expensesByCategory,
    monthlyFlow: dashboard.monthlyFlow,
    recentTransactions: await Promise.all(dashboard.recentTransactions.map(resolveTransaction)),
    budgetStatuses: await Promise.all(
      dashboard.budgetStatuses.map(async ({ budget, status }) =>
        toBudgetStatusDto(budget, status, await resolveCategory(budget.categoryId))
      )
    ),
  }
}
