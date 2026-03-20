'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types'
import {
  LayoutDashboard, Users, HandCoins, CreditCard,
  Gift, User, Landmark, Shield, ChevronRight
} from 'lucide-react'
import Image from 'next/image'

interface SidebarProps {
  profile: Profile | null
}

const investorNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/loans', label: 'Loans', icon: HandCoins },
  { href: '/profile', label: 'My Profile', icon: User },
]

const adminNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/loans', label: 'Loans', icon: HandCoins },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/distribution', label: 'Distribution', icon: Gift },
  { href: '/profile', label: 'My Profile', icon: User },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile?.role === 'admin'
  const navItems = isAdmin ? adminNav : investorNav

  return (
    <aside className="w-64 bg-earth-900 flex flex-col shadow-2xl" style={{ background: '#2c1a0e' }}>
      {/* Logo */}
      <div className="p-6 border-b border-earth-700" style={{ borderColor: '#4a2e18' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-md">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-brand-200">Gram Nidhi</h1>
            <p className="text-xs text-earth-400">Village Loans</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      {isAdmin && (
        <div className="mx-4 mt-4">
          <div className="flex items-center gap-1.5 bg-brand-600 bg-opacity-20 border border-brand-600 border-opacity-30 rounded-lg px-3 py-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Admin Panel</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                active
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-earth-300 hover:bg-earth-800 hover:text-white'
              }`}
              style={!active ? { '--tw-bg-opacity': 1 } as React.CSSProperties : {}}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-white' : 'text-earth-400 group-hover:text-brand-300'}`} style={{ width: '18px', height: '18px' }} />
              <span className="text-sm font-medium flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t" style={{ borderColor: '#4a2e18' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-700 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name} width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <span className="text-sm font-bold text-brand-200">
                {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-earth-100 truncate">{profile?.full_name}</p>
            <p className="text-xs text-earth-400 capitalize">{profile?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
