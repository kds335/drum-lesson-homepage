import { requireAuth } from '@/lib/auth'
import { ScheduleView } from './ScheduleView'
import type { Booking } from '@/lib/types'

export default async function SchedulePage() {
  const { user, supabase } = await requireAuth('/schedule')

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('bookings')
      .select('*, lessons(*)')
      .eq('student_id', user.id)
      .order('scheduled_at', { ascending: false }),
  ])

  return (
    <ScheduleView
      userName={profile?.full_name ?? ''}
      bookings={(bookings ?? []) as Booking[]}
    />
  )
}
