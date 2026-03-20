// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import AddPaymentModal from '@/components/admin/AddPaymentModal'
import AddContributionModal from '@/components/admin/AddContributionModal'
import { formatCurrency, formatDate } from '@/lib/calculations'

export default async function PaymentsPage() {
  const supabase = createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, loan:loans(principal, borrower:borrowers(full_name))')
    .order('payment_date', { ascending: false })

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*, investor:profiles(full_name)')
    .order('contribution_date', { ascending: false })

  const { data: loansRaw } = await supabase
    .from('loans')
    .select('id, principal, borrower:borrowers(full_name)')
    .eq('status', 'active')

  const loans = (loansRaw ?? []).map((l) => ({
    id: l.id,
    principal: l.principal,
    borrower: Array.isArray(l.borrower) ? l.borrower[0] ?? null : l.borrower,
  }))

  const { data: members } = await supabase.from('profiles').select('id, full_name').order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Payments & Contributions</h1>
          <p className="text-earth-500 mt-1">Record loan repayments and investor contributions</p>
        </div>
        <div className="flex gap-2">
          <AddContributionModal members={members ?? []} />
          <AddPaymentModal loans={loans} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-display text-lg font-semibold text-earth-800 mb-4">Loan Repayments</h2>
          <div className="space-y-3">
            {(payments ?? []).slice(0, 20).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div>
                  <p className="font-semibold text-earth-800 text-sm">{p.loan?.borrower?.full_name}</p>
                  <p className="text-xs text-earth-500">{formatDate(p.payment_date)}</p>
                  {p.notes && <p className="text-xs text-earth-400 mt-0.5">{p.notes}</p>}
                </div>
                <p className="font-bold text-green-700">{formatCurrency(Number(p.amount))}</p>
              </div>
            ))}
            {(payments ?? []).length === 0 && (
              <p className="text-earth-400 text-sm text-center py-6">No repayments recorded yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-lg font-semibold text-earth-800 mb-4">Investor Contributions</h2>
          <div className="space-y-3">
            {(contributions ?? []).slice(0, 20).map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-100">
                <div>
                  <p className="font-semibold text-earth-800 text-sm">{c.investor?.full_name}</p>
                  <p className="text-xs text-earth-500">{formatDate(c.contribution_date)}</p>
                  {c.notes && <p className="text-xs text-earth-400 mt-0.5">{c.notes}</p>}
                </div>
                <p className="font-bold text-brand-700">{formatCurrency(Number(c.amount))}</p>
              </div>
            ))}
            {(contributions ?? []).length === 0 && (
              <p className="text-earth-400 text-sm text-center py-6">No contributions recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
