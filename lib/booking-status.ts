import type { BookingStatus, PracticeBookingStatus, ContactStatus } from './types'

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

export type TransitionIntent = 'confirm' | 'cancel' | 'restore'

export interface TransitionDescriptor {
  label: string
  intent: TransitionIntent
}

export function getTransitionDescriptor(from: string, to: string): TransitionDescriptor {
  if (from === 'cancelled' && to === 'confirmed') return { label: '복구', intent: 'restore' }
  if (to === 'confirmed') return { label: '확정', intent: 'confirm' }
  return { label: '취소', intent: 'cancel' }
}

// Contact status machine — linear chain, no reversal
export const contactStateMachine = createStateMachine<ContactStatus>({
  new: ['read'],
  read: ['replied'],
  replied: [],
})

// Button labels for each target contact status
export const contactTransitionLabels: Partial<Record<ContactStatus, string>> = {
  read: '읽음',
  replied: '답변완료',
}
