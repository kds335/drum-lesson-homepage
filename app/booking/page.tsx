import { requireAuth } from '@/lib/auth'
import { BookingWizard } from './BookingWizard'
import type { Lesson } from '@/lib/types'

export default async function BookingPage() {
  const { user, supabase } = await requireAuth('/booking')

  const [{ data: profile }, { data: lessons }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
    supabase.from('lessons').select('*').order('price'),
  ])

  return (
    <BookingWizard
      lessons={(lessons ?? []) as Lesson[]}
      userName={profile?.full_name ?? ''}
      userPhone={profile?.phone ?? ''}
    />
  )
}
