import { requireAdmin } from '@/lib/auth'
import { AdminDashboard } from './AdminDashboard'
import type { Booking, Profile, PracticeBooking, Contact, MonthlyPackage } from '@/lib/types'

export default async function AdminPage() {
  const { supabase } = await requireAdmin()

  const [{ data: bookings }, { data: students }, { data: practiceBookings }, { data: contacts }, { data: packages }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, profiles(id, full_name, phone, role, created_at), lessons(*)')
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false }),
    supabase
      .from('practice_bookings')
      .select('*, practice_rooms(*)')
      .order('date', { ascending: false })
      .order('start_hour', { ascending: false }),
    supabase
      .from('contacts')
      .select('id, name, phone, email, message, status, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('monthly_packages')
      .select('*')
      .order('price'),
  ])

  return (
    <AdminDashboard
      bookings={(bookings ?? []) as Booking[]}
      students={(students ?? []) as Profile[]}
      practiceBookings={(practiceBookings ?? []) as PracticeBooking[]}
      contacts={(contacts ?? []) as Contact[]}
      packages={(packages ?? []) as MonthlyPackage[]}
    />
  )
}
