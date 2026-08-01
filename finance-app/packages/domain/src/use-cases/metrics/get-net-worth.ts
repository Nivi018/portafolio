import type { IAccountRepository, IAssetRepository, ILoanRepository } from '../../ports'

export interface NetWorthData { assets: number; liabilities: number; netWorth: number }

export function makeGetNetWorth(deps: { accountRepo: IAccountRepository; assetRepo: IAssetRepository; loanRepo: ILoanRepository }) {
  return async (financialSpaceId: string): Promise<NetWorthData> => {
    const [accounts, assets, loans] = await Promise.all([
      deps.accountRepo.findByFinancialSpaceId(financialSpaceId), deps.assetRepo.findByFinancialSpaceId(financialSpaceId), deps.loanRepo.findByFinancialSpaceId(financialSpaceId),
    ])
    const accountAssets = accounts.filter((account) => account.type !== 'CREDIT').reduce((total, account) => total + Math.max(account.balance, 0), 0)
    const creditDebt = accounts.filter((account) => account.type === 'CREDIT').reduce((total, account) => total + Math.abs(Math.min(account.balance, 0)), 0)
    const loanDebt = loans.reduce((total, loan) => total + loan.currentBalance, 0)
    const totalAssets = accountAssets + assets.reduce((total, asset) => total + asset.currentValue, 0)
    const liabilities = creditDebt + loanDebt
    return { assets: totalAssets, liabilities, netWorth: totalAssets - liabilities }
  }
}
