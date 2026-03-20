import { createClient } from '@/lib/supabase/server'
import AddMemberModal from '@/components/admin/AddMemberModal'
import { formatCurrency } from '@/lib/calculations'
import { Users, Plus } from 'lucide-react'
import Image from 'next/image'

export default async function MembersPage() {
  const supabase = createClient()
  const { data: members } = await supabase
    .from('profiles')
    .select('*, contributions(*)')
    .order('created_at')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-earth-900">Members</h1>
          <p className="text-earth-500 mt-1">Manage investors and contributors</p>
        </div>
        <AddMemberModal />
      </div>

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(members ?? []).map(member => {
          const totalContrib = (member.contributions ?? []).reduce((s: number, c: { amount: number }) => s + Number(c.amount), 0)
          return (
            <div key={member.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {member.avatar_url ? (
                    <Image src={member.avatar_url} alt={member.full_name} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <span className="font-display text-xl font-bold text-brand-600">
                      {member.full_name[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-earth-900 text-lg leading-tight">{member.full_name}</h3>
                    {member.role === 'admin' && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                    )}
                  </div>
                  <p className="text-sm text-earth-500 mt-0.5">{member.phone}</p>
                  <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-brand-100">
                    <p className="text-xs text-earth-500">Total Contribution</p>
                    <p className="font-display font-bold text-brand-700 text-lg">{formatCurrency(totalContrib)}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {(members ?? []).length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-earth-300 mx-auto mb-3" />
          <p className="text-earth-500 font-medium">No members yet</p>
          <p className="text-earth-400 text-sm mt-1">Add your first investor member</p>
        </div>
      )}
    </div>
  )
}
