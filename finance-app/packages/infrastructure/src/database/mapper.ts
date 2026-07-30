import type {
  TransactionModel,
  FinanceAccountModel,
  CategoryModel,
  BudgetModel,
  GoalModel,
  RecurringTransactionModel,
  UserModel,
} from "../generated/prisma/models"
import type {
  TransactionType,
  AccountType,
  CategoryType,
  BudgetPeriod,
  RecurrenceFrequency,
  Currency,
} from "@finance/shared"
import {
  Transaction,
  Account,
  Category,
  Budget,
  Goal,
  RecurringTransaction,
  User,
} from "@finance/domain"

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
    userId: row.userId,
    recurringId: row.recurringId,
    createdAt: row.createdAt,
  })
}

export function toDomainAccount(row: FinanceAccountModel): Account {
  return Account.reconstitute({
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type as AccountType,
    balance: row.balance,
    currency: row.currency as Currency,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export function toDomainCategory(row: CategoryModel): Category {
  return Category.reconstitute({
    id: row.id,
    userId: row.userId,
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
    userId: row.userId,
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
    userId: row.userId,
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    deadline: row.deadline,
    createdAt: row.createdAt,
  })
}

export function toDomainRecurring(row: RecurringTransactionModel): RecurringTransaction {
  return RecurringTransaction.reconstitute({
    id: row.id,
    userId: row.userId,
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

export function toDomainUser(row: UserModel): User {
  return User.reconstitute({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    createdAt: row.createdAt,
  })
}
