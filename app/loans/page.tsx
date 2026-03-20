import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/shared/Sidebar'
import TopBar from '@/components/shared/TopBar'
import LoanCalculatorView from '@/components/shared/LoanCalculatorView'
import { formatCurrency, formatDate, calculateLoanInterest } from '@/lib/calculations'

export default async function LoansPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const { data: loans } = await supabase
    .from('loans')
    .select('*, borrower:borrowers(*, guarantor:profiles(full_name, id)), payments(*)')
    .order('created_at', { ascending: false })

  const myGuaranteedLoans = (loans ?? []).filter(l => l.borrower?.guarantor_id === profile?.id)

  return (
    <div className="flex h-screen overflow-hidden bg-amber-50">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-earth-900">Loans Overview</h1>
            <p className="text-earth-500 mt-1">All active loans and your guarantees</p>
          </div>

          {/* My Guarantees */}
          {myGuaranteedLoans.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-earth-800 mb-3">My Guarantees</h2>
              <div className="space-y-3">
                {myGuaranteedLoans.map(loan => {
                  const paid = (loan.payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
                  const calc = calculateLoanInterest(
                    Number(loan.principal),
                    Number(loan.monthly_interest_rate),
                    new Date(loan.borrow_date),
                    new Date()
                  )
                  return (
                    <div key={loan.id} className="card border-l-4 border-l-red-400">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <p className="font-display font-bold text-earth-900 text-lg">{loan.borrower?.full_name}</p>
                          <p className="text-sm text-earth-500">{loan.borrower?.phone} · {loan.borrower?.address}</p>
                          <p className="text-sm text-earth-500 mt-1">Borrowed: {formatDate(loan.borrow_date)} · {loan.monthly_interest_rate}%/month</p>
                        </div>
                        <span className={`badge-${loan.status}`}>{loan.status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-earth-500">Principal</p>
                          <p className="font-bold text-earth-900">{formatCurrency(Number(loan.principal))}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-earth-500">Interest (till today)</p>
                          <p className="font-bold text-orange-700">{formatCurrency(calc.totalInterest)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-earth-500">Paid</p>
                          <p className="font-bold text-green-700">{formatCurrency(paid)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* All Active Loans */}
          <div>
            <h2 className="font-display text-xl font-semibold text-earth-800 mb-3">All Active Loans</h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 border-b border-brand-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase">Borrower</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase">Guarantor</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase">Principal</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase">Interest (today)</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase">Paid</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {(loans ?? []).filter(l => l.status !== 'settled').map(loan => {
                    const paid = (loan.payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
                    const calc = calculateLoanInterest(Number(loan.principal), Number(loan.monthly_interest_rate), new Date(loan.borrow_date), new Date())
                    return (
                      <tr key={loan.id} className="hover:bg-amber-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-earth-900 text-sm">{loan.borrower?.full_name}</p>
                          <p className="text-xs text-earth-400">{formatDate(loan.borrow_date)}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-earth-600">{loan.borrower?.guarantor?.full_name ?? '—'}</td>
                        <td className="px-5 py-4 text-right font-bold text-earth-900 text-sm">{formatCurrency(Number(loan.principal))}</td>
                        <td className="px-5 py-4 text-right text-orange-700 font-semibold text-sm">{formatCurrency(calc.totalInterest)}</td>
                        <td className="px-5 py-4 text-right text-green-700 font-semibold text-sm">{formatCurrency(paid)}</td>
                        <td className="px-5 py-4"><span className={`badge-${loan.status}`}>{loan.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {(loans ?? []).filter(l => l.status !== 'settled').length === 0 && (
                <p className="text-center text-earth-400 py-8 text-sm">No active loans</p>
              )}
            </div>
          </div>

          {/* Interest Calculator */}
          <LoanCalculatorView />
        </main>
      </div>
    </div>
  )
}
