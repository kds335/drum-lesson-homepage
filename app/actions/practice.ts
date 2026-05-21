'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { practiceBookingStateMachine } from '@/lib/booking-status'
import { validatePracticeInput } from '@/lib/validators'
import { updateRecordStatus } from '@/lib/record-status-action'
import { PRACTICE_HOURLY_RATE, PRACTICE_MEMBER_DAILY_LIMIT } from '@/lib/types'
import type { PracticeBookingStatus } from '@/lib/types'

export interface CreatePracticeBookingInput {
  roomId: string
  date: string
  startHour: number
  bookerName: string
  bookerPhone: string
}

export type PracticeActionResult = { error?: string; success?: boolean }

export async function createPracticeBooking(
  input: CreatePracticeBookingInput
): Promise<PracticeActionResult> {
  const validation = validatePracticeInput(input)
  if (!validation.ok) return { error: validation.error }
  const { name, phone, endHour } = validation

  const dateStr = input.date

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: room } = await supabase
    .from('practice_rooms')
    .select('id, is_active')
    .eq('id', input.roomId)
    .maybeSingle()

  if (!room || !room.is_active) {
    return { error: '존재하지 않거나 사용 불가한 연습실입니다.' }
  }

  const { data: conflict } = await supabase
    .from('practice_bookings')
    .select('id')
    .eq('room_id', input.roomId)
    .eq('date', dateStr)
    .eq('start_hour', input.startHour)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (conflict) return { error: '이미 예약된 시간입니다.' }

  const isMember = !!user

  if (isMember) {
    const { data: used } = await supabase.rpc('count_member_practice_hours', {
      p_user_id: user.id,
      p_date: dateStr,
    })
    const usedHours = (used ?? 0) as number
    if (usedHours >= PRACTICE_MEMBER_DAILY_LIMIT) {
      return {
        error: `회원은 하루 최대 ${PRACTICE_MEMBER_DAILY_LIMIT}시간까지만 예약 가능합니다.`,
      }
    }
  }

  const amount = isMember ? 0 : PRACTICE_HOURLY_RATE

  const { error } = await supabase.from('practice_bookings').insert({
    room_id: input.roomId,
    date: dateStr,
    start_hour: input.startHour,
    end_hour: endHour,
    booker_name: name,
    booker_phone: phone,
    user_id: user?.id ?? null,
    is_member: isMember,
    status: 'pending',
    amount,
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
