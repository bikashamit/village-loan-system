import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/shared/Sidebar'
import TopBar from '@/components/shared/TopBar'
import ProfileClient from '@/components/shared/ProfileClient'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('investor_id', profile?.id ?? '')
    .order('contribution_date')

  const { data: distributions } = await supabase
    .from('distributions')
    .select('*')
    .eq('investor_id', profile?.id ?? '')
    .order('distribution_date')

  const { data: guaranteedLoans } = await supabase
    .from('loans')
    .select('*, borrower:borrowers(full_name, phone), payments(*)')
    .eq('borrowers.guarantor_id', profile?.id ?? '')

  return (
    <div className="flex h-screen overflow-hidden bg-amber-50">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          <ProfileClient
            profile={profile}
            contributions={contributions ?? []}
            distributions={distributions ?? []}
          />
        </main>
      </div>
    </div>
  )
}
