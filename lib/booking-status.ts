import type { BookingStatus } from './types'

export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: ['confirmed'],
}

export function getAllowedTransitions(status: BookingStatus): BookingStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? []
}

export function canTransitionTo(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}
