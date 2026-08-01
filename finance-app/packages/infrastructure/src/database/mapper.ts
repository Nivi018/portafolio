import type {
  TransactionModel,
  FinanceAccountModel,
  CreditCardProfileModel,
  CategoryModel,
  BudgetModel,
  GoalModel,
  PlanItemModel,
  RecurringTransactionModel,
  LoanModel,
  LoanPaymentModel,
  UserModel,
  FinancialSpaceModel,
  FinancialSpaceMemberModel,
  AssetModel,
  AssetValuationModel,
} from "../generated/prisma/models"
import type {
  TransactionType,
  AccountType,
  CategoryType,
  BudgetPeriod,
  PlanItemFrequency,
  PlanItemType,
  RecurrenceFrequency,
  Currency,
} from "@finance/shared"
import {
  Transaction,
  Account,
  Category,
  Budget,
  Goal,
  PlanItem,
  RecurringTransaction,
  CreditCardProfile,
  User,
  FinancialSpace,
  FinancialSpaceMember,
  Loan,
  LoanPayment,
  Asset,
  AssetValuation,
} from "@finance/domain"
import type { FinancialSpaceMemberRole, FinancialSpaceType } from "@finance/shared"

/**
 * Mappers: Prisma rows -> Domain entities.
 * The DB stores enum-like values as String; here we cast them to the
 * shared union types (validated at the domain boundary).
 */

export function toDomainTransaction(row: TransactionModel): Transaction {
  return Transaction.reconstitute({
    id: row.id,
    amount: row.amount,
    description: row.description,
    type: row.type as TransactionType,
    date: row.date,
    categoryId: row.categoryId,
    accountId: row.accountId,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    recurringId: row.recurringId,
    createdAt: row.createdAt,
  })
}

export function toDomainAccount(row: FinanceAccountModel): Account {
  return Account.reconstitute({
    id: row.id,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    name: row.name,
    type: row.type as AccountType,
    balance: row.balance,
    currency: row.currency as Currency,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export function toDomainCreditCardProfile(
  row: CreditCardProfileModel,
): CreditCardProfile {
  return CreditCardProfile.reconstitute({
    id: row.id,
    accountId: row.accountId,
    bank: row.bank,
    product: row.product,
    creditLimit: row.creditLimit,
    apr: row.apr,
    statementCloseDay: row.statementCloseDay,
    paymentDueDay: row.paymentDueDay,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export function toDomainCategory(row: CategoryModel): Category {
  return Category.reconstitute({
    id: row.id,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type as CategoryType,
    createdAt: row.createdAt,
  })
}

export function toDomainBudget(row: BudgetModel): Budget {
  return Budget.reconstitute({
    id: row.id,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    amount: row.amount,
    period: row.period as BudgetPeriod,
    categoryId: row.categoryId,
    startDate: row.startDate,
    createdAt: row.createdAt,
  })
}

export function toDomainGoal(row: GoalModel): Goal {
  return Goal.reconstitute({
    id: row.id,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    deadline: row.deadline,
    expectedAnnualReturn: row.expectedAnnualReturn,
    monthlyContributionTarget: row.monthlyContributionTarget,
    createdAt: row.createdAt,
  })
}

export function toDomainPlanItem(row: PlanItemModel): PlanItem {
  return PlanItem.reconstitute({
    id: row.id,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    name: row.name,
    amount: row.amount,
    type: row.type as PlanItemType,
    frequency: row.frequency as PlanItemFrequency,
    categoryId: row.categoryId,
    accountId: row.accountId,
    isFixed: row.isFixed,
    isMicroExpense: row.isMicroExpense,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export function toDomainRecurring(row: RecurringTransactionModel): RecurringTransaction {
  return RecurringTransaction.reconstitute({
    id: row.id,
    financialSpaceId: requiredFinancialSpaceId(row.financialSpaceId),
    amount: row.amount,
    description: row.description,
    type: row.type as TransactionType,
    frequency: row.frequency as RecurrenceFrequency,
    nextDueDate: row.nextDueDate,
    categoryId: row.categoryId,
    accountId: row.accountId,
    active: row.active,
    createdAt: row.createdAt,
  })
}

export function toDomainLoan(row: LoanModel): Loan {
  return Loan.reconstitute({
    id: row.id,
    financialSpaceId: row.financialSpaceId,
    lender: row.lender,
    name: row.name,
    originalPrincipal: row.originalPrincipal,
    currentBalance: row.currentBalance,
    annualRate: row.annualRate,
    termMonths: row.termMonths,
    monthlyPayment: row.monthlyPayment,
    startDate: row.startDate,
    nextPaymentDate: row.nextPaymentDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export function toDomainLoanPayment(row: LoanPaymentModel): LoanPayment {
  return LoanPayment.reconstitute({
    id: row.id,
    loanId: row.loanId,
    amount: row.amount,
    date: row.date,
    transactionId: row.transactionId,
    createdAt: row.createdAt,
  })
}

export function toDomainAsset(row: AssetModel): Asset {
  return Asset.reconstitute({ id: row.id, financialSpaceId: row.financialSpaceId, name: row.name, type: row.type as import('@finance/shared').AssetType, currentValue: row.currentValue, notes: row.notes, createdAt: row.createdAt, updatedAt: row.updatedAt })
}

export function toDomainAssetValuation(row: AssetValuationModel): AssetValuation {
  return AssetValuation.reconstitute({ id: row.id, assetId: row.assetId, value: row.value, date: row.date, notes: row.notes, createdAt: row.createdAt })
}

function requiredFinancialSpaceId(financialSpaceId: string | null): string {
  if (!financialSpaceId) {
    throw new Error("Finance records must belong to a financial space")
  }
  return financialSpaceId
}

export function toDomainUser(row: UserModel): User {
  return User.reconstitute({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    createdAt: row.createdAt,
  })
}

export function toDomainFinancialSpace(row: FinancialSpaceModel): FinancialSpace {
  return FinancialSpace.reconstitute({
    id: row.id,
    name: row.name,
    type: row.type as FinancialSpaceType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export function toDomainFinancialSpaceMember(
  row: FinancialSpaceMemberModel,
): FinancialSpaceMember {
  return FinancialSpaceMember.reconstitute({
    financialSpaceId: row.financialSpaceId,
    userId: row.userId,
    role: row.role as FinancialSpaceMemberRole,
    createdAt: row.createdAt,
  })
}
