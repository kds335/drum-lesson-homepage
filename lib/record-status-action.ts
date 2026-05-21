import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type { StateMachine } from '@/lib/booking-status'

/**
 * Generic admin status-update helper.
 * Calls requireAdmin, guards the transition through the state machine,
 * updates the row, then revalidates the given paths.
 *
 * Uses `as any` for the supabase client's `.from()` call because the
 * server client has no Database generic, making dynamic table names a
 * TypeScript limitation rather than a runtime concern.
 */
export async function updateRecordStatus<T extends string>({
  table,
  id,
  nextStatus,
  stateMachine,
  revalidatePaths,
}: {
  table: string
  id: string
  nextStatus: T
  stateMachine: StateMachine<T>
  revalidatePaths: string[]
}): Promise<{ error?: string; success?: boolean }> {
  const { supabase } = await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: row } = await db
    .from(table)
    .select('status')
    .eq('id', id)
    .single()

  if (!row) return { error: '항목을 찾을 수 없습니다.' }

  if (!stateMachine.canTransitionTo(row.status as T, nextStatus)) {
    return { error: '허용되지 않는 상태 변경입니다.' }
  }

  const { error } = await db
    .from(table)
    .update({ status: nextStatus })
    .eq('id', id)

  if (error) return { error: '상태 업데이트 중 오류가 발생했습니다.' }

  revalidatePaths.forEach(p => revalidatePath(p))
  return { success: true }
}
