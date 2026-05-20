'use client'

import { useState, useTransition } from 'react'
import { Users, Calendar, TrendingUp, Clock, Check, X, Search, ChevronDown } from 'lucide-react'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { updateBookingStatus } from '@/app/actions/booking'
import { getAllowedTransitions } from '@/lib/booking-status'
import { computeBookingStats } from '@/lib/booking-stats'
import type { Booking, Profile, BookingStatus } from '@/lib/types'

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
}

type Tab = 'bookings' | 'students'

interface Props {
  bookings: Booking[]
  students: Profile[]
}

export function AdminDashboard({ bookings, students }: Props) {
  const [tab, setTab] = useState<Tab>('bookings')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const stats_data = computeBookingStats(bookings)

  const stats = [
    { label: '이번 달 예약', value: String(stats_data.thisMonthCount), sub: '이번 달 전체', icon: Calendar, color: 'indigo' },
    { label: '전체 수강생', value: String(students.length), sub: '활성 수강생', icon: Users, color: 'purple' },
    { label: '이번 달 매출', value: stats_data.thisMonthRevenueFormatted, sub: '확정 레슨 기준', icon: TrendingUp, color: 'emerald' },
    { label: '대기중 예약', value: String(stats_data.pendingCount), sub: '확인 필요', icon: Clock, color: 'amber' },
  ]

  const handleStatusUpdate = (id: string, status: BookingStatus) => {
    startTransition(async () => { await updateBookingStatus(id, status) })
  }

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (search && !b.profiles?.full_name.includes(search) && !b.lessons?.name.includes(search)) return false
    return true
  })

  return (
    <div className="py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2">
              🔒 관리자 전용
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">관리자 대시보드</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">비트스튜디오 드럼교습소 운영 현황</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[stat.color]}`}>
                <stat.icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
              <div className="text-xs text-green-500 mt-1">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mb-6">
          <button
            onClick={() => setTab('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'bookings' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            예약 관리
          </button>
          <button
            onClick={() => setTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'students' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            수강생 관리
          </button>
        </div>

        {tab === 'bookings' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="학생명 / 레슨명 검색"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as BookingStatus | 'all')}
                  className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">대기중</option>
                  <option value="confirmed">확정</option>
                  <option value="cancelled">취소</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">학생</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">레슨</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">일시</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">금액</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">상태</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filtered.map(booking => (
                      <tr key={booking.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isPending ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{booking.profiles?.full_name}</div>
                          <div className="text-xs text-gray-400">{booking.profiles?.phone}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{booking.lessons?.name}</div>
                          <div className="text-xs text-gray-400">{booking.lessons?.duration}분</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDateTime(booking.scheduled_at)}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {booking.lessons && formatPrice(booking.lessons.price)}
                        </td>
                        <td className="px-5 py-4">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {getAllowedTransitions(booking.status).map(target => (
                              target === 'confirmed' && booking.status === 'pending' ? (
                                <button
                                  key={target}
                                  onClick={() => handleStatusUpdate(booking.id, target)}
                                  disabled={isPending}
                                  className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-40"
                                  title="확정"
                                >
                                  <Check size={14} />
                                </button>
                              ) : target === 'cancelled' && booking.status === 'pending' ? (
                                <button
                                  key={target}
                                  onClick={() => handleStatusUpdate(booking.id, target)}
                                  disabled={isPending}
                                  className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-40"
                                  title="취소"
                                >
                                  <X size={14} />
                                </button>
                              ) : target === 'cancelled' ? (
                                <button
                                  key={target}
                                  onClick={() => handleStatusUpdate(booking.id, target)}
                                  disabled={isPending}
                                  className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40"
                                >
                                  취소
                                </button>
                              ) : (
                                <button
                                  key={target}
                                  onClick={() => handleStatusUpdate(booking.id, target)}
                                  disabled={isPending}
                                  className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-medium disabled:opacity-40"
                                >
                                  복구
                                </button>
                              )
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">해당하는 예약이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">수강생 목록</h3>
              <span className="text-sm text-gray-400">총 {students.length}명</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {students.map(student => {
                const studentBookings = bookings.filter(b => b.student_id === student.id)
                const confirmed = studentBookings.filter(b => b.status === 'confirmed').length

                return (
                  <div key={student.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                        {student.full_name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{student.full_name}</div>
                        <div className="text-sm text-gray-400">{student.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center hidden sm:block">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{studentBookings.length}</div>
                        <div className="text-xs text-gray-400">전체</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">{confirmed}</div>
                        <div className="text-xs text-gray-400">확정</div>
                      </div>
                      <div className="text-center hidden sm:block">
                        <div className="text-xs text-gray-400">등록일</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{student.created_at.slice(0, 7)}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">이번 주 레슨 일정</h3>
          <div className="grid grid-cols-7 gap-2">
            {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => {
              const dayBookings = bookings.filter(b => {
                const d = new Date(b.scheduled_at)
                const dow = d.getDay()
                const adjustedIdx = (dow === 0 ? 6 : dow - 1)
                return adjustedIdx === idx && b.status !== 'cancelled'
              })
              return (
                <div key={day} className="text-center">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{day}</div>
                  <div className="space-y-1">
                    {dayBookings.length === 0 ? (
                      <div className="h-8 rounded-lg bg-gray-50 dark:bg-gray-700/50" />
                    ) : (
                      dayBookings.map(b => (
                        <div key={b.id} className="py-1 px-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-[10px] text-indigo-700 dark:text-indigo-300 leading-tight">
                          {b.scheduled_at.slice(11, 16)}
                          <div className="text-indigo-400 truncate">{b.profiles?.full_name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
