'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Plus, X, UserPlus } from 'lucide-react'

export default function AddMemberModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'investor',
    initial_contribution: '',
    contribution_date: new Date().toISOString().split('T')[0],
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin
        ? { data: null, error: { message: 'Use signUp instead' } }
        : { data: null, error: null }

      // Use signUp (will send confirmation email - admin should use service role in production)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
            role: form.role,
          }
        }
      })

      if (signUpError) throw signUpError

      if (signUpData.user) {
        // Upsert profile (trigger should handle this, but just in case)
        await supabase.from('profiles').upsert({
          user_id: signUpData.user.id,
          full_name: form.full_name,
          phone: form.phone,
          role: form.role,
        }, { onConflict: 'user_id' })

        // Get profile id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', signUpData.user.id)
          .single()

        // Add initial contribution if provided
        if (form.initial_contribution && profile) {
          await supabase.from('contributions').insert({
            investor_id: profile.id,
            amount: parseFloat(form.initial_contribution),
            contribution_date: form.contribution_date,
            notes: 'Initial contribution',
          })
        }
      }

      toast.success(`Member ${form.full_name} added! They'll receive a confirmation email.`)
      setOpen(false)
      setForm({ full_name: '', phone: '', email: '', password: '', role: 'investor', initial_contribution: '', contribution_date: new Date().toISOString().split('T')[0] })
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    }
    setLoading(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
      <UserPlus className="w-4 h-4" />
      Add Member
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-brand-100">
          <h2 className="font-display text-xl font-bold text-earth-900">Add New Member</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-earth-100">
            <X className="w-5 h-5 text-earth-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input-field" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="Ram Kumar" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="9876543210" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="ram@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="investor">Investor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Initial Contribution (₹) — optional</label>
            <input type="number" className="input-field" value={form.initial_contribution} onChange={e => setForm({ ...form, initial_contribution: e.target.value })} placeholder="5000" min="0" />
          </div>
          {form.initial_contribution && (
            <div>
              <label className="label">Contribution Date</label>
              <input type="date" className="input-field" value={form.contribution_date} onChange={e => setForm({ ...form, contribution_date: e.target.value })} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-4 h-4" />Add Member</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
