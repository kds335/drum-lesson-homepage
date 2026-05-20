'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X, Loader2, Check, Music, Volume2 } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createPracticeBooking } from '@/app/actions/practice'
import { DAYS, getDaysInMonth, getFirstDayOfMonth, toDateString } from '@/lib/calendar'
import {
  PRACTICE_HOURLY_RATE,
  PRACTICE_MEMBER_DAILY_LIMIT,
  PRACTICE_OPEN_HOUR,
  PRACTICE_CLOSE_HOUR,
} from '@/lib/types'
import type { PracticeRoom, PracticeSlot } from '@/lib/types'

interface Props {
  rooms: PracticeRoom[]
  isLoggedIn: boolean
  userName: string
  userPhone: string
}

const HOURS = Array.from(
  { length: PRACTICE_CLOSE_HOUR - PRACTICE_OPEN_HOUR },
  (_, i) => PRACTICE_OPEN_HOUR + i
)

const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`

export function PracticeBookingClient({ rooms, isLoggedIn, userName, userPhone }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const todayStr = toDateString(today.getFullYear(), today.getMonth(), today.getDate())
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  const [slots, setSlots] = useState<PracticeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [modalSlot, setModalSlot] = useState<{ roomId: string; hour: number } | null>(null)
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState(userPhone)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<{ roomName: string; hour: number; amount: number } | null>(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const loadSlots = useCallback(async (date: string) => {
    setLoadingSlots(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('get_practice_slots', { p_date: date })
    setSlots((data ?? []) as PracticeSlot[])
    setLoadingSlots(false)
  }, [])

  useEffect(() => {
    loadSlots(selectedDate)
  }, [selectedDate, loadSlots])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(year, month, day)
    if (date < new Date(today.toDateString())) return
    setSelectedDate(toDateString(year, month, day))
  }

  const slotAt = (roomId: string, hour: number): PracticeSlot | undefined =>
    slots.find(s => s.room_id === roomId && s.start_hour === hour)

  const isPastSlot = (hour: number): boolean => {
    if (selectedDate !== todayStr) return false
    return hour <= today.getHours()
  }

  const openModal = (roomId: string, hour: number) => {
    if (slotAt(roomId, hour)) return
    if (isPastSlot(hour)) return
    setModalSlot({ roomId, hour })
    setName(userName)
    setPhone(userPhone)
    setSubmitError(null)
  }

  const closeModal = () => {
    setModalSlot(null)
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalSlot) return
    setSubmitting(true)
    setSubmitError(null)
    const result = await createPracticeBooking({
      roomId: modalSlot.roomId,
      date: selectedDate,
      startHour: modalSlot.hour,
      bookerName: name,
      bookerPhone: phone,
    })
    setSubmitting(false)
    if (result.error) { setSubmitError(result.error); return }
    const room = rooms.find(r => r.id === modalSlot.roomId)
    setSubmitted({
      roomName: room?.name ?? '',
      hour: modalSlot.hour,
      amount: isLoggedIn ? 0 : PRACTICE_HOURLY_RATE,
    })
    closeModal()
    loadSlots(selectedDate)
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">연습실 예약</h1>
          <p className="text-gray-500 dark:text-gray-400">
            전자드럼 · 어쿠스틱 연습실 시간당 예약 (09:00~21:00)
          </p>
          {isLoggedIn ? (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              회원 혜택: 하루 {PRACTICE_MEMBER_DAILY_LIMIT}시간 무료
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              일반 이용료: 시간당 {formatPrice(PRACTICE_HOURLY_RATE)}
            </div>
          )}
        </div>

        {submitted && (
          <div className="max-w-xl mx-auto mb-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                예약 신청 완료
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                {submitted.roomName} · {fmtHour(submitted.hour)}~{fmtHour(submitted.hour + 1)} · {submitted.amount > 0 ? formatPrice(submitted.amount) : '무료'}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                원장님 확인 후 확정됩니다.
              </p>
            </div>
            <button onClick={() => setSubmitted(null)} className="text-green-700 dark:text-green-400">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
              <h3 className="font-semibold text-gray-900 dark:text-white">{year}년 {month + 1}월</h3>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className={cn('text-center text-xs font-medium py-1', d === '일' ? 'text-red-400' : 'text-gray-400')}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(year, month, day)
                const dateStr = toDateString(year, month, day)
                const isPast = date < new Date(today.toDateString())
                const isSelected = selectedDate === dateStr
                const isToday = dateStr === todayStr

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    disabled={isPast}
                    className={cn(
                      'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors',
                      isSelected ? 'bg-indigo-600 text-white font-bold' :
                      isToday ? 'border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold' :
                      isPast ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' :
                      'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
                <span className="text-gray-500 dark:text-gray-400">예약 가능</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-800" />
                <span className="text-gray-500 dark:text-gray-400">대기중</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/50 border border-red-400 dark:border-red-800" />
                <span className="text-gray-500 dark:text-gray-400">확정</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700" />
                <span className="text-gray-500 dark:text-gray-400">예약 불가</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedDate.replace(/-/g, '.')} 예약 현황
                </h3>
              </div>
              {loadingSlots && <Loader2 size={16} className="text-indigo-500 animate-spin" />}
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                <Music size={32} className="mx-auto mb-2 opacity-30" />
                연습실이 등록되지 않았습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-900/50">시간</th>
                      {rooms.map(room => (
                        <th key={room.id} className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              {room.type === 'electronic' ? (
                                <Volume2 size={12} className="text-indigo-500" />
                              ) : (
                                <Music size={12} className="text-purple-500" />
                              )}
                              <span>{room.name}</span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map(hour => (
                      <tr key={hour} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800 whitespace-nowrap">
                          {fmtHour(hour)}~{fmtHour(hour + 1)}
                        </td>
                        {rooms.map(room => {
                          const slot = slotAt(room.id, hour)
                          const past = isPastSlot(hour)
                          const isBooked = !!slot
                          const status = slot?.status

                          return (
                            <td key={room.id} className="px-1.5 py-1.5">
                              <button
                                onClick={() => openModal(room.id, hour)}
                                disabled={isBooked || past}
                                className={cn(
                                  'w-full py-2 rounded-lg text-xs font-medium border transition-colors',
                                  past && !isBooked && 'bg-gray-50 dark:bg-gray-700/30 text-gray-300 dark:text-gray-600 border-transparent cursor-not-allowed',
                                  !isBooked && !past && 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400',
                                  status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 cursor-not-allowed',
                                  status === 'confirmed' && 'bg-red-200 dark:bg-red-900/50 border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 cursor-not-allowed'
                                )}
                              >
                                {isBooked ? (status === 'confirmed' ? '확정' : '대기') : past ? '-' : '예약'}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">연습실 예약</h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">연습실</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {rooms.find(r => r.id === modalSlot.roomId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">날짜</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">시간</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {fmtHour(modalSlot.hour)}~{fmtHour(modalSlot.hour + 1)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">금액</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {isLoggedIn ? '무료 (회원)' : formatPrice(PRACTICE_HOURLY_RATE)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="홍길동"
                  disabled={isLoggedIn && !!userName}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {!isLoggedIn && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  로그인 시 하루 {PRACTICE_MEMBER_DAILY_LIMIT}시간 무료로 이용 가능합니다.
                </p>
              )}

              {submitError && (
                <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  예약하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
