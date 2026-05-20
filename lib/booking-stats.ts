import type { Booking } from './types'
import { formatPrice } from './utils'

export interface BookingStats {
  thisMonthCount: number
  thisMonthRevenue: number
  thisMonthRevenueFormatted: string
  pendingCount: number
}

export function computeBookingStats(bookings: Booking[]): BookingStats {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const thisMonth = bookings.filter(b =>
    b.scheduled_at >= monthStart && b.scheduled_at <= monthEnd
  )
  const thisMonthRevenue = thisMonth
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.lessons?.price ?? 0), 0)

  return {
    thisMonthCount: thisMonth.length,
    thisMonthRevenue,
    thisMonthRevenueFormatted: formatPrice(thisMonthRevenue),
    pendingCount: bookings.filter(b => b.status === 'pending').length,
  }
}
