import {
  PRACTICE_OPEN_HOUR,
  PRACTICE_CLOSE_HOUR,
  PRACTICE_HOURLY_RATE,
  PRACTICE_MEMBER_DAILY_LIMIT,
} from './types'

// Minimal client interface — test-friendly; any object with `from` + `rpc` satisfies it
type QueryClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, params?: object) => any
}

// ── Input types (owned here; actions + clients import from this module) ────

export interface CreateBookingInput {
  lessonId: string
  scheduledAt: string
  notes: string | null
}

export interface CreatePracticeBookingInput {
  roomId: string
  date: string
  startHour: number
  bookerName: string
  bookerPhone: string
}

// ── Lesson booking admission ───────────────────────────────────────────────

export type LessonAdmitCode =
  | 'INVALID_DATE'
  | 'PAST_DATE'
  | 'SUNDAY'
  | 'SLOT_UNAVAILABLE'
  | 'DOUBLE_BOOKING'

export type LessonAdmitResult =
  | { ok: true }
  | { ok: false; code: LessonAdmitCode; error: string }

/**
 * Owns ALL lesson booking admission: pure date/day checks + DB slot/conflict
 * queries. The action only inserts and revalidates after this returns ok.
 *
 * Supabase client is injected so a fake client can be passed in tests.
 */
export async function admitLessonBooking({
  supabase,
  input,
}: {
  supabase: QueryClient
  input: CreateBookingInput
}): Promise<LessonAdmitResult> {
  // ── Pure checks ────────────────────────────────────────────────────────
  const dt = new Date(input.scheduledAt)
  if (isNaN(dt.getTime())) {
    return { ok: false, code: 'INVALID_DATE', error: '잘못된 날짜 형식입니다.' }
  }
  if (dt < new Date()) {
    return { ok: false, code: 'PAST_DATE', error: '과거 날짜는 예약할 수 없습니다.' }
  }

  const dayOfWeek = dt.getDay()
  if (dayOfWeek === 0) {
    return { ok: false, code: 'SUNDAY', error: '일요일은 예약할 수 없습니다.' }
  }

  const startTime = input.scheduledAt.slice(11, 16)

  // ── DB checks (parallel) ──────────────────────────────────────────────
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

  if (!slot) {
    return { ok: false, code: 'SLOT_UNAVAILABLE', error: '선택한 시간은 예약이 불가합니다.' }
  }
  if (existing) {
    return { ok: false, code: 'DOUBLE_BOOKING', error: '이미 예약된 시간입니다.' }
  }

  return { ok: true }
}

// ── Practice room booking admission ───────────────────────────────────────

export type PracticeAdmitCode =
  | 'INVALID_NAME'
  | 'INVALID_PHONE'
  | 'NO_ROOM_SELECTED'
  | 'INVALID_HOUR'
  | 'INVALID_DATE'
  | 'PAST_SLOT'
  | 'ROOM_INACTIVE'
  | 'CONFLICT'
  | 'DAILY_LIMIT_EXCEEDED'

export type PracticeAdmitResult =
  | { ok: true; name: string; phone: string; endHour: number; amount: number }
  | { ok: false; code: PracticeAdmitCode; error: string }

/**
 * Owns ALL practice room booking admission: pure field/hour/date checks +
 * DB room-active, conflict, and member daily-limit queries.
 * The action only inserts and revalidates after this returns ok.
 *
 * userId is null for non-members (unauthenticated).
 * Supabase client is injected so a fake client can be passed in tests.
 */
export async function admitPracticeBooking({
  supabase,
  userId,
  input,
}: {
  supabase: QueryClient
  userId: string | null
  input: CreatePracticeBookingInput
}): Promise<PracticeAdmitResult> {
  // ── Pure checks ────────────────────────────────────────────────────────
  const name = input.bookerName.trim()
  const phone = input.bookerPhone.trim()

  if (!name || name.length < 2) {
    return { ok: false, code: 'INVALID_NAME', error: '이름을 정확히 입력해주세요.' }
  }
  if (!phone) {
    return { ok: false, code: 'INVALID_PHONE', error: '연락처를 입력해주세요.' }
  }
  if (!input.roomId) {
    return { ok: false, code: 'NO_ROOM_SELECTED', error: '연습실을 선택해주세요.' }
  }
  if (
    !Number.isInteger(input.startHour) ||
    input.startHour < PRACTICE_OPEN_HOUR ||
    input.startHour >= PRACTICE_CLOSE_HOUR
  ) {
    return { ok: false, code: 'INVALID_HOUR', error: '운영 시간 외의 시간입니다.' }
  }

  const slotStart = new Date(
    `${input.date}T${String(input.startHour).padStart(2, '0')}:00:00`
  )
  if (isNaN(slotStart.getTime())) {
    return { ok: false, code: 'INVALID_DATE', error: '잘못된 날짜입니다.' }
  }
  if (slotStart < new Date()) {
    return { ok: false, code: 'PAST_SLOT', error: '지난 시간은 예약할 수 없습니다.' }
  }

  const endHour = input.startHour + 1

  // ── DB checks ─────────────────────────────────────────────────────────
  const { data: room } = await supabase
    .from('practice_rooms')
    .select('id, is_active')
    .eq('id', input.roomId)
    .maybeSingle()

  if (!room || !room.is_active) {
    return { ok: false, code: 'ROOM_INACTIVE', error: '존재하지 않거나 사용 불가한 연습실입니다.' }
  }

  const { data: conflict } = await supabase
    .from('practice_bookings')
    .select('id')
    .eq('room_id', input.roomId)
    .eq('date', input.date)
    .eq('start_hour', input.startHour)
    .neq('status', 'cancelled')
    .maybeSingle()

  if (conflict) {
    return { ok: false, code: 'CONFLICT', error: '이미 예약된 시간입니다.' }
  }

  if (userId) {
    const { data: used } = await supabase.rpc('count_member_practice_hours', {
      p_user_id: userId,
      p_date: input.date,
    })
    const usedHours = (used ?? 0) as number
    if (usedHours >= PRACTICE_MEMBER_DAILY_LIMIT) {
      return {
        ok: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        error: `회원은 하루 최대 ${PRACTICE_MEMBER_DAILY_LIMIT}시간까지만 예약 가능합니다.`,
      }
    }
  }

  const amount = userId ? 0 : PRACTICE_HOURLY_RATE

  return { ok: true, name, phone, endHour, amount }
}
