'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Plus, X, Wallet } from 'lucide-react'

interface Member { id: string; full_name: string }

export default function AddContributionModal({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    investor_id: '',
    amount: '',
    contribution_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('contributions').insert({
        investor_id: form.investor_id,
        amount: parseFloat(form.amount),
        contribution_date: form.contribution_date,
        notes: form.notes || null,
      })
      if (error) throw error
      toast.success('Contribution recorded!')
      setOpen(false)
      setForm({ investor_id: '', amount: '', contribution_date: new Date().toISOString().split('T')[0], notes: '' })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record contribution')
    }
    setLoading(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-2">
      <Wallet className="w-4 h-4" />
      Add Contribution
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-brand-100">
          <h2 className="font-display text-xl font-bold text-earth-900">Record Contribution</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-earth-100"><X className="w-5 h-5 text-earth-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Investor</label>
            <select className="input-field" value={form.investor_id} onChange={e => setForm({ ...form, investor_id: e.target.value })} required>
              <option value="">— Select Member —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1" placeholder="5000" />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.contribution_date} onChange={e => setForm({ ...form, contribution_date: e.target.value })} required />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <input className="input-field" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Annual contribution, extra deposit..." />
          </div>
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
