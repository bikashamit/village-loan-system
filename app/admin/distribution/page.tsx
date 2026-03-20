import { createClient } from '@/lib/supabase/server'
import AddDistributionModal from '@/components/admin/AddDistributionModal'
import { formatCurrency, formatDate } from '@/lib/calculations'
import { Gift } from 'lucide-react'

export default async function DistributionPage() {
  const supabase = createClient()

  const { data: distributions } = await supabase
    .from('distributions')
    .select('*, investor:profiles(full_name, avatar_url)')
    .order('distribution_date', { ascending: false })

  const { data: members } = await supabase.from('profiles').select('id, full_name').order('full_name')

  // Total by year
  const byYear: Record<number, number> = {}
  ;(distributions ?? []).forEach(d => {
    byYear[d.year] = (byYear[d.year] ?? 0) + Number(d.amount)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Profit Distribution</h1>
          <p className="text-earth-500 mt-1">Year-end returns to investors</p>
        </div>
        <AddDistributionModal members={members ?? []} />
      </div>

      {/* Year summaries */}
      {Object.keys(byYear).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([year, total]) => (
            <div key={year} className="card text-center border border-brand-200">
              <p className="text-xs font-semibold text-earth-500 uppercase">{year}</p>
              <p className="font-display text-xl font-bold text-brand-700 mt-1">{formatCurrency(total)}</p>
              <p className="text-xs text-earth-400 mt-0.5">distributed</p>
            </div>
          ))}
        </div>
      )}

      {/* Distribution list */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-amber-50 border-b border-brand-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Investor</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Year</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-earth-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {(distributions ?? []).map(d => (
                <tr key={d.id} className="hover:bg-amber-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-earth-800 text-sm">{d.investor?.full_name}</td>
                  <td className="px-5 py-4 text-sm text-earth-600">{d.year}</td>
                  <td className="px-5 py-4 text-sm text-earth-600">{formatDate(d.distribution_date)}</td>
                  <td className="px-5 py-4 text-right font-bold text-brand-700">{formatCurrency(Number(d.amount))}</td>
                  <td className="px-5 py-4 text-sm text-earth-400">{d.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(distributions ?? []).length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-earth-300 mx-auto mb-3" />
            <p className="text-earth-500 font-medium">No distributions yet</p>
            <p className="text-earth-400 text-sm mt-1">Record year-end profit distributions here</p>
          </div>
        )}
      </div>
    </div>
  )
}
