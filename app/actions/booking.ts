'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canTransitionTo } from '@/lib/booking-status'
import { validateBookingInput } from '@/lib/validators'
import type { BookingStatus } from '@/lib/types'

export interface CreateBookingInput {
  lessonId: string
  scheduledAt: string
  notes: string | null
}

export type BookingActionResult = { error?: string; success?: boolean }

export async function createBooking(input: CreateBookingInput): Promise<BookingActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const validation = validateBookingInput(input)
  if (!validation.ok) return { error: validation.error }
  const { dayOfWeek, startTime } = validation

  const [{ data: slot }, { data: existing }] = await Promise.all([
    supabase
      .from('schedules')
      .select('id')
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', startTime)
      .eq('is_available', true)
      .maybeSingle(),
    supabase
      .from('bookings')
      .select('id')
      .eq('scheduled_at', input.scheduledAt)
      .neq('status', 'cancelled')
      .maybeSingle(),
  ])

  if (!slot) return { error: '선택한 시간은 예약이 불가합니다.' }
  if (existing) return { error: '이미 예약된 시간입니다.' }

  const { error } = await supabase.from('bookings').insert({
    student_id: user.id,
    lesson_id: input.lessonId,
    scheduled_at: input.scheduledAt,
    notes: input.notes,
    status: 'pending',
  })

  if (error) return { error: '예약 중 오류가 발생했습니다.' }

  revalidatePath('/schedule')
  return { success: true }
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<BookingActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', id)
    .single()

  if (!booking) return { error: '예약을 찾을 수 없습니다.' }
  if (!canTransitionTo(booking.status as BookingStatus, status)) {
    return { error: '허용되지 않는 상태 변경입니다.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)

  if (error) return { error: '상태 업데이트 중 오류가 발생했습니다.' }

  revalidatePath('/admin')
  revalidatePath('/schedule')
  return { success: true }
}

export async function requestCancellation(id: string): Promise<BookingActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('status, scheduled_at')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!booking) return { error: '예약을 찾을 수 없습니다.' }

  const hoursUntil = (new Date(booking.scheduled_at).getTime() - Date.now()) / 3_600_000
  if (hoursUntil < 24) return { error: '레슨 24시간 전까지만 취소 가능합니다.' }

  if (!canTransitionTo(booking.status as BookingStatus, 'cancelled')) {
    return { error: '취소할 수 없는 상태입니다.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return { error: '취소 중 오류가 발생했습니다.' }

  revalidatePath('/schedule')
  revalidatePath('/admin')
  return { success: true }
}
