'use client'

import { useState, useTransition } from 'react'
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { requestCancellation } from '@/app/actions/booking'
import { formatDateTime } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { DAYS, getDaysInMonth, getFirstDayOfMonth, toDateString } from '@/lib/calendar'
import Link from 'next/link'
import type { Booking } from '@/lib/types'

interface Props {
  userName: string
  bookings: Booking[]
}

export function ScheduleView({ userName, bookings }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [cancelErrors, setCancelErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const getBookingsForDay = (day: number) => {
    const dateStr = toDateString(year, month, day)
    return bookings.filter(b => b.scheduled_at.startsWith(dateStr))
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const upcoming = bookings
    .filter(b => new Date(b.scheduled_at) >= today && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  return (
    <div className="py-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">내 레슨 일정</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              안녕하세요, <span className="font-medium text-gray-900 dark:text-white">{userName}</span>님
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <Calendar size={16} />
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                목록
              </button>
            </div>
            <Link
              href="/booking"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} /> 예약하기
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {view === 'calendar' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <h3 className="font-bold text-gray-900 dark:text-white">{year}년 {month + 1}월</h3>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS.map(d => (
                      <div key={d} className={`text-center text-xs font-medium py-2 ${d === '일' ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const dayBookings = getBookingsForDay(day)
                      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                      const isSunday = new Date(year, month, day).getDay() === 0

                      return (
                        <div
                          key={day}
                          className={`min-h-[60px] rounded-xl p-1 border transition-colors ${
                            isToday ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' :
                            'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className={`text-xs font-medium mb-1 px-1 ${isSunday ? 'text-red-400' : isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {day}
                          </div>
                          {dayBookings.map(b => (
                            <div key={b.id} className={`text-[10px] px-1 py-0.5 rounded mb-0.5 truncate ${
                              b.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                              b.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-500'
                            }`}>
                              {b.scheduled_at.slice(11, 16)} {b.lessons?.name.slice(0, 4)}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[...bookings].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()).map(booking => {
                  const canCancel = booking.status === 'confirmed' || booking.status === 'pending'
                  const cancelError = cancelErrors[booking.id]

                  const handleCancel = () => {
                    if (!window.confirm('예약을 취소하시겠습니까?')) return
                    startTransition(async () => {
                      const result = await requestCancellation(booking.id)
                      if (result.error) {
                        setCancelErrors(prev => ({ ...prev, [booking.id]: result.error! }))
                      } else {
                        setCancelErrors(prev => { const next = { ...prev }; delete next[booking.id]; return next })
                      }
                    })
                  }

                  return (
                    <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BookingStatusBadge status={booking.status} />
                            <span className="font-semibold text-gray-900 dark:text-white">{booking.lessons?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <Clock size={14} />
                            {formatDateTime(booking.scheduled_at)}
                          </div>
                          {booking.notes && (
                            <p className="text-xs text-gray-400 mt-1">{booking.notes}</p>
                          )}
                          {cancelError && (
                            <p className="text-xs text-red-500 mt-1">{cancelError}</p>
                          )}
                        </div>
                        {canCancel && (
                          <button
                            onClick={handleCancel}
                            disabled={isPending}
                            className="shrink-0 text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPending ? '처리중...' : '취소 요청'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">레슨 현황</h3>
              <div className="space-y-3">
                {[
                  { label: '전체 예약', value: bookings.length, color: 'text-gray-900 dark:text-white' },
                  { label: '확정 레슨', value: bookings.filter(b => b.status === 'confirmed').length, color: 'text-green-600 dark:text-green-400' },
                  { label: '대기중', value: bookings.filter(b => b.status === 'pending').length, color: 'text-yellow-600 dark:text-yellow-400' },
                  { label: '취소', value: bookings.filter(b => b.status === 'cancelled').length, color: 'text-red-500' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{item.value}회</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">다가오는 레슨</h3>
              {upcoming.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400 mb-3">예약된 레슨이 없습니다</p>
                  <Link href="/booking" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                    예약하러 가기 →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 3).map(b => (
                    <div key={b.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                          {new Date(b.scheduled_at).getDate()}
                        </span>
                        <span className="text-[10px] text-indigo-400">
                          {DAYS[new Date(b.scheduled_at).getDay()]}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{b.lessons?.name}</div>
                        <div className="text-xs text-gray-400">{b.scheduled_at.slice(11, 16)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/50 rounded-2xl p-4 border border-amber-100 dark:border-amber-900">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">안내사항</h4>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <li>• 레슨 취소는 24시간 전까지 가능합니다</li>
                <li>• 당일 취소 시 레슨비가 차감됩니다</li>
                <li>• 변경은 원장님께 직접 연락주세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
