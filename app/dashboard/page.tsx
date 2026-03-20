import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/lib/calculations'
import { TrendingUp, Users, HandCoins, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  const { data: contributions } = await supabase.from('contributions').select('amount')
  const { data: loans } = await supabase.from('loans').select('*, payments(*), borrower:borrowers(*, guarantor:profiles(*))')
  const { data: payments } = await supabase.from('payments').select('amount')
  const { data: members } = await supabase.from('profiles').select('id, full_name, role')
  const { data: myContributions } = await supabase.from('contributions').select('amount').eq('investor_id', profile?.id ?? '')
  const { data: distributions } = await supabase.from('distributions').select('amount').eq('investor_id', profile?.id ?? '')

  const totalPool = (contributions ?? []).reduce((s: number, c: any) => s + Number(c.amount), 0)
  const totalLoaned = (loans ?? []).filter((l: any) => l.status !== 'settled').reduce((s: number, l: any) => s + Number(l.principal), 0)
  const totalRepaid = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0)
  const balance = totalPool - totalLoaned + totalRepaid
  const activeLoans = (loans ?? []).filter((l: any) => l.status === 'active').length
  const settledLoans = (loans ?? []).filter((l: any) => l.status === 'settled').length
  const myTotalContrib = (myContributions ?? []).reduce((s: number, c: any) => s + Number(c.amount), 0)
  const myTotalDist = (distributions ?? []).reduce((s: number, d: any) => s + Number(d.amount), 0)
  const myGuaranteedLoans = (loans ?? []).filter((l: any) => l.borrower?.guarantor_id === profile?.id && l.status === 'active')

  const adminCards = [
    { label: 'Total Pool', value: formatCurrency(totalPool), icon: Wallet, color: 'bg-brand-50 text-brand-600', border: 'border-brand-200' },
    { label: 'Available Balance', value: formatCurrency(balance), icon: TrendingUp, color: 'bg-green-50 text-green-600', border: 'border-green-200' },
    { label: 'Total Members', value: String(members?.length ?? 0), icon: Users, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
    { label: 'Active Loans', value: String(activeLoans), icon: HandCoins, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
  ]
  const investorCards = [
    { label: 'My Contribution', value: formatCurrency(myTotalContrib), icon: Wallet, color: 'bg-brand-50 text-brand-600', border: 'border-brand-200' },
    { label: 'Total Pool', value: formatCurrency(totalPool), icon: TrendingUp, color: 'bg-green-50 text-green-600', border: 'border-green-200' },
    { label: 'My Distributions', value: formatCurrency(myTotalDist), icon: GiftIcon, color: 'bg-purple-50 text-purple-600', border: 'border-purple-200' },
    { label: 'Active Loans', value: String(activeLoans), icon: HandCoins, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
  ]
  const statCards = isAdmin ? adminCards : investorCards

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-earth-900">Dashboard</h1>
        <p className="text-earth-500 mt-1">Overview of Gram Nidhi loan pool</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`card border ${border}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-earth-500 font-medium">{label}</p>
                <p className="font-display text-2xl font-bold text-earth-900 mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-earth-800">Recent Active Loans</h2>
            <Link href={isAdmin ? '/admin/loans' : '/loans'} className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all →</Link>
          </div>
          <div className="space-y-3">
            {(loans ?? []).filter((l: any) => l.status === 'active').slice(0, 5).map((loan: any) => (
              <div key={loan.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-brand-100">
                <div>
                  <p className="font-semibold text-earth-800 text-sm">{loan.borrower?.full_name}</p>
                  <p className="text-xs text-earth-500">{loan.monthly_interest_rate}%/mo · {new Date(loan.borrow_date).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-earth-900 text-sm">{formatCurrency(Number(loan.principal))}</p>
                  <span className="badge-active">Active</span>
                </div>
              </div>
            ))}
            {(loans ?? []).filter((l: any) => l.status === 'active').length === 0 && (
              <p className="text-earth-400 text-sm text-center py-4">No active loans</p>
            )}
          </div>
        </div>

        <div className="card">
          {!isAdmin ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-earth-800">My Guarantees</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">{myGuaranteedLoans.length} active</span>
              </div>
              <div className="space-y-3">
                {myGuaranteedLoans.slice(0, 5).map((loan: any) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-earth-800 text-sm">{loan.borrower?.full_name}</p>
                        <p className="text-xs text-earth-500">You are guarantor</p>
                      </div>
                    </div>
                    <p className="font-bold text-red-700 text-sm">{formatCurrency(Number(loan.principal))}</p>
                  </div>
                ))}
                {myGuaranteedLoans.length === 0 && (
                  <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="text-sm font-medium">No active guarantees</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-earth-800 mb-4">Loan Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-earth-700">Settled Loans</span>
                  </div>
                  <span className="font-bold text-green-700">{settledLoans}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <HandCoins className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-earth-700">Active Loans</span>
                  </div>
                  <span className="font-bold text-amber-700">{activeLoans}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-earth-700">Total Repaid</span>
                  </div>
                  <span className="font-bold text-blue-700">{formatCurrency(totalRepaid)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-600" />
                    <span className="text-sm font-medium text-earth-700">Currently Loaned</span>
                  </div>
                  <span className="font-bold text-brand-700">{formatCurrency(totalLoaned)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
