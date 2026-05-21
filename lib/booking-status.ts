import type { BookingStatus, PracticeBookingStatus } from './types'

export interface StateMachine<T extends string> {
  canTransitionTo(from: T, to: T): boolean
  getAllowedTransitions(status: T): T[]
}

export function createStateMachine<T extends string>(
  transitions: Record<T, T[]>
): StateMachine<T> {
  return {
    canTransitionTo(from, to) {
      return transitions[from]?.includes(to) ?? false
    },
    getAllowedTransitions(status) {
      return transitions[status] ?? []
    },
  }
}

export const lessonBookingStateMachine = createStateMachine<BookingStatus>({
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: ['confirmed'],
})

export const practiceBookingStateMachine = createStateMachine<PracticeBookingStatus>({
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: ['confirmed'],
})
