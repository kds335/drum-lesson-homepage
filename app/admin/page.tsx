import { requireAdmin } from '@/lib/auth'
import { AdminDashboard } from './AdminDashboard'
import type { Booking, Profile } from '@/lib/types'

export default async function AdminPage() {
  const { supabase } = await requireAdmin()

  const [{ data: bookings }, { data: students }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, profiles(id, full_name, phone, role, created_at), lessons(*)')
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false }),
  ])

  return (
    <AdminDashboard
      bookings={(bookings ?? []) as Booking[]}
      students={(students ?? []) as Profile[]}
    />
  )
}
