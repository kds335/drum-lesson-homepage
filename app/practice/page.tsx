import { createClient } from '@/lib/supabase/server'
import { PracticeBookingClient } from './PracticeBookingClient'
import type { PracticeRoom } from '@/lib/types'

export default async function PracticePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rooms }, profileRes] = await Promise.all([
    supabase
      .from('practice_rooms')
      .select('*')
      .eq('is_active', true)
      .order('name'),
    user
      ? supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const profile = profileRes.data as { full_name: string; phone: string | null } | null

  return (
    <PracticeBookingClient
      rooms={(rooms ?? []) as PracticeRoom[]}
      isLoggedIn={!!user}
      userName={profile?.full_name ?? ''}
      userPhone={profile?.phone ?? ''}
    />
  )
}
