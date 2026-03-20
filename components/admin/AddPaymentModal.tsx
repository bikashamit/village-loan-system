'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Plus, X, CreditCard } from 'lucide-react'

interface Loan { id: string; principal: number; borrower: { full_name: string } | null }

export default function AddPaymentModal({ loans }: { loans: Loan[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    loan_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    mark_settled: false,
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('payments').insert({
        loan_id: form.loan_id,
        amount: parseFloat(form.amount),
        payment_date: form.payment_date,
        notes: form.notes || null,
      })
      if (error) throw error

      if (form.mark_settled) {
        await supabase.from('loans').update({
          status: 'settled',
          settlement_date: form.payment_date,
        }).eq('id', form.loan_id)
      } else {
        await supabase.from('loans').update({ status: 'partial' }).eq('id', form.loan_id)
      }

      toast.success('Payment recorded!')
      setOpen(false)
      setForm({ loan_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], notes: '', mark_settled: false })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment')
    }
    setLoading(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
      <CreditCard className="w-4 h-4" />
      Record Payment
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-brand-100">
          <h2 className="font-display text-xl font-bold text-earth-900">Record Repayment</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-earth-100"><X className="w-5 h-5 text-earth-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Loan</label>
            <select className="input-field" value={form.loan_id} onChange={e => setForm({ ...form, loan_id: e.target.value })} required>
              <option value="">— Select Loan —</option>
              {loans.map(l => (
                <option key={l.id} value={l.id}>
                  {l.borrower?.full_name} — ₹{l.principal.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount Paid (₹)</label>
            <input type="number" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1" placeholder="5000" />
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input-field" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input-field" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Cash payment, part payment..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.mark_settled} onChange={e => setForm({ ...form, mark_settled: e.target.checked })} className="w-4 h-4 accent-brand-600" />
            <span className="text-sm font-medium text-earth-700">Mark loan as fully settled</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-4 h-4" />Record</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
