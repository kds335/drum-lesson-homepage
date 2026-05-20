import {
  PRACTICE_OPEN_HOUR,
  PRACTICE_CLOSE_HOUR,
} from '@/lib/types'
import type { CreateBookingInput } from '@/app/actions/booking'
import type { CreatePracticeBookingInput } from '@/app/actions/practice'

// ── Lesson Booking ────────────────────────────────────────────────

export type BookingValidation =
  | { ok: true; dayOfWeek: number; startTime: string }
  | { ok: false; error: string }

/**
 * Pure validation for lesson booking input.
 * Returns computed dayOfWeek + startTime on success so callers
 * don't need to re-derive them.
 */
export function validateBookingInput(input: CreateBookingInput): BookingValidation {
  const dt = new Date(input.scheduledAt)

  if (isNaN(dt.getTime())) return { ok: false, error: '잘못된 날짜 형식입니다.' }
  if (dt < new Date()) return { ok: false, error: '과거 날짜는 예약할 수 없습니다.' }

  const dayOfWeek = dt.getDay()
  if (dayOfWeek === 0) return { ok: false, error: '일요일은 예약할 수 없습니다.' }

  const startTime = input.scheduledAt.slice(11, 16)

  return { ok: true, dayOfWeek, startTime }
}

// ── Practice Room Booking ─────────────────────────────────────────

export type PracticeValidation =
  | { ok: true; name: string; phone: string; endHour: number; slotStart: Date }
  | { ok: false; error: string }

/**
 * Pure validation for practice room booking input.
 * Returns sanitised name/phone + computed endHour + slotStart on success.
 */
export function validatePracticeInput(input: CreatePracticeBookingInput): PracticeValidation {
  const name = input.bookerName.trim()
  const phone = input.bookerPhone.trim()

  if (!name || name.length < 2) return { ok: false, error: '이름을 정확히 입력해주세요.' }
  if (!phone) return { ok: false, error: '연락처를 입력해주세요.' }
  if (!input.roomId) return { ok: false, error: '연습실을 선택해주세요.' }

  if (
    !Number.isInteger(input.startHour) ||
    input.startHour < PRACTICE_OPEN_HOUR ||
    input.startHour >= PRACTICE_CLOSE_HOUR
  ) {
    return { ok: false, error: '운영 시간 외의 시간입니다.' }
  }

  const slotStart = new Date(
    `${input.date}T${String(input.startHour).padStart(2, '0')}:00:00`
  )
  if (isNaN(slotStart.getTime())) return { ok: false, error: '잘못된 날짜입니다.' }
  if (slotStart < new Date()) return { ok: false, error: '지난 시간은 예약할 수 없습니다.' }

  const endHour = input.startHour + 1

  return { ok: true, name, phone, endHour, slotStart }
}
