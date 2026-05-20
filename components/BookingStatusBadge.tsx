import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/lib/types'

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: '확정', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: '취소', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
