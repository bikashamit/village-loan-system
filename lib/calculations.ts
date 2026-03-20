import { LoanCalculation, YearlyBreakdown } from '@/types'

/**
 * Calendar Year Compounding Interest Calculator
 * Matches the logic of https://investment-calculator-one-rouge.vercel.app/calculator
 * Interest compounds at end of each calendar year
 */
export function calculateLoanInterest(
  principal: number,
  monthlyRate: number,
  borrowDate: Date,
  settlementDate: Date
): LoanCalculation {
  const breakdown: YearlyBreakdown[] = []
  let balance = principal

  const startYear = borrowDate.getFullYear()
  const endYear = settlementDate.getFullYear()

  for (let year = startYear; year <= endYear; year++) {
    const yearStart = year === startYear ? borrowDate : new Date(year, 0, 1)
    const yearEnd = year === endYear ? settlementDate : new Date(year, 11, 31)

    // Calculate months in this year (fractional)
    const monthsInYear = monthsBetween(yearStart, yearEnd)

    const interest = balance * (monthlyRate / 100) * monthsInYear
    const openingBalance = balance

    if (year < endYear) {
      // Compound: add interest to balance for next year
      balance = balance + interest
    }

    breakdown.push({
      year,
      openingBalance,
      interest,
      closingBalance: year < endYear ? balance : openingBalance + interest,
      months: monthsInYear,
    })
  }

  const totalInterest = breakdown.reduce((sum, b) => sum + b.interest, 0)
  const totalDue = principal + totalInterest

  return {
    principal,
    monthlyRate,
    borrowDate,
    settlementDate,
    totalInterest,
    totalDue,
    breakdown,
  }
}

function monthsBetween(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear()
  const months = end.getMonth() - start.getMonth()
  const days = end.getDate() - start.getDate()
  return years * 12 + months + days / 30
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
