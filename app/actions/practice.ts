'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { practiceBookingStateMachine } from '@/lib/booking-status'
import { admitPracticeBooking } from '@/lib/booking-intake'
import { updateRecordStatus } from '@/lib/record-status-action'
import type { PracticeBookingStatus } from '@/lib/types'
import type { CreatePracticeBookingInput } from '@/lib/booking-intake'

export type PracticeActionResult = { error?: string; success?: boolean }

export async function createPracticeBooking(
  input: CreatePracticeBookingInput
): Promise<PracticeActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admission = await admitPracticeBooking({
    supabase,
    userId: user?.id ?? null,
    input,
  })
  if (!admission.ok) return { error: admission.error }

  const { error } = await supabase.from('practice_bookings').insert({
    room_id: input.roomId,
    date: input.date,
    start_hour: input.startHour,
    end_hour: admission.endHour,
    booker_name: admission.name,
    booker_phone: admission.phone,
    user_id: user?.id ?? null,
    is_member: !!user,
    status: 'pending',
    amount: admission.amount,
  })

  if (error) return { error: '예약 중 오류가 발생했습니다.' }

  revalidatePath('/practice')
  revalidatePath('/admin')
  return { success: true }
}

export async function updatePracticeBookingStatus(
  id: string,
  status: PracticeBookingStatus
): Promise<PracticeActionResult> {
  return updateRecordStatus({
    table: 'practice_bookings',
    id,
    nextStatus: status,
    stateMachine: practiceBookingStateMachine,
    revalidatePaths: ['/admin', '/practice'],
  })
}
