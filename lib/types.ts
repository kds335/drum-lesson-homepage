export type UserRole = 'student' | 'admin'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export type LessonCategory = 'individual' | 'group' | 'online'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  created_at: string
}

export interface Lesson {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: LessonCategory
  created_at: string
}

export interface Booking {
  id: string
  student_id: string
  lesson_id: string
  scheduled_at: string
  status: BookingStatus
  notes: string | null
  created_at: string
  profiles?: Profile
  lessons?: Lesson
}

export interface TimeSlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

export interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
}

export type PracticeRoomType = 'electronic' | 'acoustic'

export type PracticeBookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface PracticeRoom {
  id: string
  name: string
  type: PracticeRoomType
  is_active: boolean
  created_at: string
}

export interface PracticeBooking {
  id: string
  room_id: string
  date: string
  start_hour: number
  end_hour: number
  booker_name: string
  booker_phone: string
  user_id: string | null
  is_member: boolean
  status: PracticeBookingStatus
  amount: number
  created_at: string
  practice_rooms?: PracticeRoom
}

export interface PracticeSlot {
  room_id: string
  start_hour: number
  end_hour: number
  status: PracticeBookingStatus
}

export const PRACTICE_HOURLY_RATE = 20000
export const PRACTICE_MEMBER_DAILY_LIMIT = 2
export const PRACTICE_OPEN_HOUR = 9
export const PRACTICE_CLOSE_HOUR = 21
