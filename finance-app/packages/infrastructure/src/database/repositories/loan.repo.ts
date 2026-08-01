import type { ILoanRepository, Loan, LoanPayment } from "@finance/domain"
import type { PrismaClient } from "../client"
import { toDomainLoan, toDomainLoanPayment } from "../mapper"

export class PrismaLoanRepository implements ILoanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Loan | null> {
    const row = await this.prisma.loan.findUnique({ where: { id } })
    return row ? toDomainLoan(row) : null
  }

  async findByFinancialSpaceId(financialSpaceId: string): Promise<Loan[]> {
    const rows = await this.prisma.loan.findMany({
      where: { financialSpaceId },
      orderBy: { createdAt: "desc" },
    })
    return rows.map(toDomainLoan)
  }

  async findPaymentsByLoanId(loanId: string): Promise<LoanPayment[]> {
    const rows = await this.prisma.loanPayment.findMany({
      where: { loanId },
      orderBy: { date: "desc" },
    })
    return rows.map(toDomainLoanPayment)
  }

  async create(loan: Loan): Promise<Loan> {
    const row = await this.prisma.loan.create({
      data: {
        id: loan.id,
        financialSpaceId: loan.financialSpaceId,
        lender: loan.lender,
        name: loan.name,
        originalPrincipal: loan.originalPrincipal,
        currentBalance: loan.currentBalance,
        annualRate: loan.annualRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
        startDate: loan.startDate,
        nextPaymentDate: loan.nextPaymentDate,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
      },
    })
    return toDomainLoan(row)
  }

  async update(loan: Loan): Promise<Loan> {
    const row = await this.prisma.loan.update({
      where: { id: loan.id },
      data: {
        lender: loan.lender,
        name: loan.name,
        originalPrincipal: loan.originalPrincipal,
        currentBalance: loan.currentBalance,
        annualRate: loan.annualRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
        startDate: loan.startDate,
        nextPaymentDate: loan.nextPaymentDate,
        updatedAt: loan.updatedAt,
      },
    })
    return toDomainLoan(row)
  }

  async createPayment(payment: LoanPayment): Promise<LoanPayment> {
    const row = await this.prisma.loanPayment.create({
      data: {
        id: payment.id,
        loanId: payment.loanId,
        amount: payment.amount,
        date: payment.date,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
      },
    })
    return toDomainLoanPayment(row)
  }
}
