'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types'
import { LogOut, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TopBar({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-16 bg-white border-b border-brand-100 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
      <div>
        <p className="text-sm text-earth-500">
          Welcome back, <span className="font-semibold text-earth-800">{profile?.full_name}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-brand-50 text-earth-500 hover:text-brand-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-earth-500 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </header>
  )
}
