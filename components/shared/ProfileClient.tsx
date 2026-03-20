'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Contribution, Distribution } from '@/types'
import { formatCurrency, formatDate } from '@/lib/calculations'
import { Camera, Printer, Save, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  profile: Profile | null
  contributions: Contribution[]
  distributions: Distribution[]
}

export default function ProfileClient({ profile, contributions, distributions }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [editName, setEditName] = useState(profile?.full_name ?? '')
  const [editPhone, setEditPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const totalContrib = contributions.reduce((s, c) => s + Number(c.amount), 0)
  const totalDist = distributions.reduce((s, d) => s + Number(d.amount), 0)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.user_id}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
      if (updateError) throw updateError

      setAvatarUrl(url)
      toast.success('Profile photo updated!')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: editName,
      phone: editPhone,
    }).eq('id', profile.id)
    if (error) toast.error('Failed to save')
    else {
      toast.success('Profile saved!')
      router.refresh()
    }
    setSaving(false)
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">My Profile</h1>
          <p className="text-earth-500 mt-1">Manage your account and view your statement</p>
        </div>
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 no-print">
          <Printer className="w-4 h-4" />
          Print Statement
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">Gram Nidhi — Village Loan System</h1>
        <p className="text-gray-500">Member Statement</p>
        <p className="text-sm text-gray-400">Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-100 flex items-center justify-center shadow-md">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={profile?.full_name ?? ''} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-10 h-10 text-brand-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity no-print"
              >
                {uploading
                  ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <p className="text-xs text-earth-400 mt-2 no-print">Click photo to change</p>

            <div className="w-full mt-4 space-y-3 no-print">
              <div>
                <label className="label text-left">Full Name</label>
                <input className="input-field text-center" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="label text-left">Phone</label>
                <input className="input-field text-center" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Save</>}
              </button>
            </div>

            {/* Print-only profile info */}
            <div className="hidden print:block mt-2">
              <p className="font-bold text-lg">{profile?.full_name}</p>
              <p className="text-gray-500">{profile?.phone}</p>
              <p className="text-sm capitalize text-gray-400">{profile?.role}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 space-y-3">
            <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-xs text-earth-500">Total Contributed</p>
              <p className="font-display text-xl font-bold text-brand-700">{formatCurrency(totalContrib)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-earth-500">Total Received (Distributions)</p>
              <p className="font-display text-xl font-bold text-green-700">{formatCurrency(totalDist)}</p>
            </div>
          </div>
        </div>

        {/* Statements */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contributions */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-earth-800 mb-4">Contribution History</h2>
            <div className="overflow-hidden rounded-xl border border-brand-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 border-b border-brand-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Date</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Amount</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {contributions.map(c => (
                    <tr key={c.id}>
                      <td className="px-4 py-2.5 text-earth-600">{formatDate(c.contribution_date)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-brand-700">{formatCurrency(Number(c.amount))}</td>
                      <td className="px-4 py-2.5 text-earth-400">{c.notes ?? '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-brand-50 border-t-2 border-brand-200">
                    <td className="px-4 py-2.5 font-bold text-earth-700">Total</td>
                    <td className="px-4 py-2.5 text-right font-display font-bold text-brand-800">{formatCurrency(totalContrib)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Distributions */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-earth-800 mb-4">Distribution History</h2>
            <div className="overflow-hidden rounded-xl border border-green-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Year</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Date</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Amount</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-earth-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {distributions.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-earth-400">No distributions yet</td></tr>
                  )}
                  {distributions.map(d => (
                    <tr key={d.id}>
                      <td className="px-4 py-2.5 font-semibold text-earth-700">{d.year}</td>
                      <td className="px-4 py-2.5 text-earth-600">{formatDate(d.distribution_date)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCurrency(Number(d.amount))}</td>
                      <td className="px-4 py-2.5 text-earth-400">{d.notes ?? '—'}</td>
                    </tr>
                  ))}
                  {distributions.length > 0 && (
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td className="px-4 py-2.5 font-bold text-earth-700" colSpan={2}>Total</td>
                      <td className="px-4 py-2.5 text-right font-display font-bold text-green-800">{formatCurrency(totalDist)}</td>
                      <td />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
