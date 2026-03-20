import { createClient } from '@/lib/supabase/server'
import AddLoanModal from '@/components/admin/AddLoanModal'
import { formatCurrency, formatDate } from '@/lib/calculations'
import { HandCoins } from 'lucide-react'

export default async function AdminLoansPage() {
  const supabase = createClient()

  const { data: loans } = await supabase
    .from('loans')
    .select('*, borrower:borrowers(*, guarantor:profiles(full_name)), payments(*)')
    .order('created_at', { ascending: false })

  const { data: members } = await supabase.from('profiles').select('id, full_name').order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Loans</h1>
          <p className="text-earth-500 mt-1">Manage all borrowings</p>
        </div>
        <AddLoanModal members={members ?? []} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['All', 'Active', 'Settled', 'Partial'].map(tab => (
          <span key={tab} className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
            tab === 'All' ? 'bg-brand-600 text-white' : 'bg-white text-earth-600 border border-earth-200 hover:bg-brand-50'
          }`}>
            {tab}
          </span>
        ))}
      </div>

      {/* Loans table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-amber-50 border-b border-brand-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Borrower</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Guarantor</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Principal</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Rate</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Borrow Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Paid</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {(loans ?? []).map(loan => {
                const paid = (loan.payments ?? []).reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0)
                return (
                  <tr key={loan.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-earth-900 text-sm">{loan.borrower?.full_name}</p>
                      <p className="text-xs text-earth-400">{loan.borrower?.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-earth-600">
                      {loan.borrower?.guarantor?.full_name ?? <span className="text-earth-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-earth-900 text-sm">{formatCurrency(Number(loan.principal))}</td>
                    <td className="px-5 py-4 text-right text-sm text-earth-600">{loan.monthly_interest_rate}%/mo</td>
                    <td className="px-5 py-4 text-sm text-earth-600">{formatDate(loan.borrow_date)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-green-700">{formatCurrency(paid)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge-${loan.status}`}>{loan.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {(loans ?? []).length === 0 && (
          <div className="text-center py-12">
            <HandCoins className="w-12 h-12 text-earth-300 mx-auto mb-3" />
            <p className="text-earth-500 font-medium">No loans yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
