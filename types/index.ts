export type UserRole = 'admin' | 'investor'

export interface Profile {
  id: string
  user_id: string
  full_name: string
  phone: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Contribution {
  id: string
  investor_id: string
  amount: number
  contribution_date: string
  notes: string | null
  created_at: string
  investor?: Profile
}

export interface Borrower {
  id: string
  full_name: string
  phone: string
  address: string
  is_group_member: boolean
  guarantor_id: string | null
  created_at: string
  guarantor?: Profile
}

export interface Loan {
  id: string
  borrower_id: string
  principal: number
  monthly_interest_rate: number
  borrow_date: string
  settlement_date: string | null
  status: 'active' | 'settled' | 'partial'
  notes: string | null
  created_at: string
  borrower?: Borrower
  payments?: Payment[]
}

export interface Payment {
  id: string
  loan_id: string
  amount: number
  payment_date: string
  notes: string | null
  created_at: string
  loan?: Loan
}

export interface Distribution {
  id: string
  investor_id: string
  amount: number
  distribution_date: string
  year: number
  notes: string | null
  created_at: string
  investor?: Profile
}

export interface LoanCalculation {
  principal: number
  monthlyRate: number
  borrowDate: Date
  settlementDate: Date
  totalInterest: number
  totalDue: number
  breakdown: YearlyBreakdown[]
}

export interface YearlyBreakdown {
  year: number
  openingBalance: number
  interest: number
  closingBalance: number
  months: number
}
