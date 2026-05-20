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
