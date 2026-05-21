'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { lessonBookingStateMachine } from '@/lib/booking-status'
import { admitLessonBooking } from '@/lib/booking-intake'
import { updateRecordStatus } from '@/lib/record-status-action'
import type { BookingStatus } from '@/lib/types'
import type { CreateBookingInput } from '@/lib/booking-intake'

export type BookingActionResult = { error?: string; success?: boolean }

export async function createBooking(input: CreateBookingInput): Promise<BookingActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const admission = await admitLessonBooking({ supabase, input })
  if (!admission.ok) return { error: admission.error }

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
  return updateRecordStatus({
    table: 'bookings',
    id,
    nextStatus: status,
    stateMachine: lessonBookingStateMachine,
    revalidatePaths: ['/admin', '/schedule'],
  })
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

  if (!lessonBookingStateMachine.canTransitionTo(booking.status as BookingStatus, 'cancelled')) {
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
