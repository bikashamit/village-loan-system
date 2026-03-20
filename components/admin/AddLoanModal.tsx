'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Plus, X, HandCoins } from 'lucide-react'
import { calculateLoanInterest, formatCurrency } from '@/lib/calculations'

interface Member { id: string; full_name: string }

export default function AddLoanModal({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [borrowerType, setBorrowerType] = useState<'member' | 'outsider'>('outsider')
  const [form, setForm] = useState({
    borrower_name: '',
    borrower_phone: '',
    borrower_address: '',
    member_id: '',
    guarantor_id: '',
    principal: '',
    monthly_interest_rate: '2',
    borrow_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const previewCalc = form.principal && form.monthly_interest_rate
    ? calculateLoanInterest(
        parseFloat(form.principal),
        parseFloat(form.monthly_interest_rate),
        new Date(form.borrow_date),
        new Date()
      )
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let borrowerId: string

      if (borrowerType === 'member') {
        // Get or create borrower linked to member profile
        const member = members.find(m => m.id === form.member_id)
        if (!member) throw new Error('Please select a member')

        const { data: existingBorrower } = await supabase
          .from('borrowers')
          .select('id')
          .eq('full_name', member.full_name)
          .eq('is_group_member', true)
          .single()

        if (existingBorrower) {
          borrowerId = existingBorrower.id
        } else {
          const { data: newBorrower, error } = await supabase.from('borrowers').insert({
            full_name: member.full_name,
            phone: '',
            address: 'Group Member',
            is_group_member: true,
            guarantor_id: null,
          }).select().single()
          if (error) throw error
          borrowerId = newBorrower.id
        }
      } else {
        const { data: newBorrower, error } = await supabase.from('borrowers').insert({
          full_name: form.borrower_name,
          phone: form.borrower_phone,
          address: form.borrower_address,
          is_group_member: false,
          guarantor_id: form.guarantor_id || null,
        }).select().single()
        if (error) throw error
        borrowerId = newBorrower.id
      }

      const { error: loanError } = await supabase.from('loans').insert({
        borrower_id: borrowerId,
        principal: parseFloat(form.principal),
        monthly_interest_rate: parseFloat(form.monthly_interest_rate),
        borrow_date: form.borrow_date,
        status: 'active',
        notes: form.notes || null,
      })

      if (loanError) throw loanError

      toast.success('Loan created successfully!')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create loan')
    }
    setLoading(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
      <HandCoins className="w-4 h-4" />
      New Loan
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-brand-100">
          <h2 className="font-display text-xl font-bold text-earth-900">Issue New Loan</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-earth-100"><X className="w-5 h-5 text-earth-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Borrower type */}
          <div>
            <label className="label">Borrower Type</label>
            <div className="flex gap-2">
              {(['member', 'outsider'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => setBorrowerType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    borrowerType === t ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-earth-600 border-earth-200 hover:bg-brand-50'
                  }`}>
                  {t === 'member' ? 'Group Member' : 'Outside Person'}
                </button>
              ))}
            </div>
          </div>

          {borrowerType === 'member' ? (
            <div>
              <label className="label">Select Member</label>
              <select className="input-field" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} required>
                <option value="">— Select Member —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Borrower Full Name</label>
                <input className="input-field" value={form.borrower_name} onChange={e => setForm({ ...form, borrower_name: e.target.value })} required placeholder="Mohan Lal" />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input-field" value={form.borrower_phone} onChange={e => setForm({ ...form, borrower_phone: e.target.value })} required placeholder="9876543210" />
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input-field" value={form.borrower_address} onChange={e => setForm({ ...form, borrower_address: e.target.value })} required placeholder="Village/Town name" />
              </div>
              <div>
                <label className="label">Guarantor (Group Member) <span className="text-red-500">*</span></label>
                <select className="input-field" value={form.guarantor_id} onChange={e => setForm({ ...form, guarantor_id: e.target.value })} required>
                  <option value="">— Select Guarantor —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Principal (₹)</label>
              <input type="number" className="input-field" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} required min="1" placeholder="10000" />
            </div>
            <div>
              <label className="label">Monthly Rate (%)</label>
              <input type="number" className="input-field" value={form.monthly_interest_rate} onChange={e => setForm({ ...form, monthly_interest_rate: e.target.value })} required step="0.1" min="0" placeholder="2" />
            </div>
          </div>

          <div>
            <label className="label">Borrow Date</label>
            <input type="date" className="input-field" value={form.borrow_date} onChange={e => setForm({ ...form, borrow_date: e.target.value })} required />
          </div>

          {/* Live interest preview */}
          {previewCalc && (
            <div className="bg-amber-50 border border-brand-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-earth-500 uppercase tracking-wider mb-2">Interest Preview (till today)</p>
              <div className="flex justify-between text-sm">
                <span className="text-earth-600">Interest accrued</span>
                <span className="font-bold text-brand-700">{formatCurrency(previewCalc.totalInterest)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-earth-600">Total due</span>
                <span className="font-bold text-earth-900">{formatCurrency(previewCalc.totalDue)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Purpose of loan..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-4 h-4" />Issue Loan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
