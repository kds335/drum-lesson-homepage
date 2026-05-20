import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth(next?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login')
  }
  return { user, supabase }
}

export async function requireAdmin() {
  const { user, supabase } = await requireAuth('/admin')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/')
  return { user, supabase }
}
