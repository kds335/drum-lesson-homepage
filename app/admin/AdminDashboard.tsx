'use client'

import { useState, useTransition, useActionState, useEffect, Fragment } from 'react'
import { Users, Calendar, TrendingUp, Clock, Check, X, Search, ChevronDown, Music, MessageSquare, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'
import { updateBookingStatus } from '@/app/actions/booking'
import { updatePracticeBookingStatus } from '@/app/actions/practice'
import { updateContactStatus } from '@/app/actions/contact'
import { createPackage, updatePackage, deletePackage, setHighlightedPackage } from '@/app/actions/packages'
import { lessonBookingStateMachine, practiceBookingStateMachine, getTransitionDescriptor, contactStateMachine, contactTransitionLabels } from '@/lib/booking-status'
import { computeBookingStats } from '@/lib/booking-stats'
import type { Booking, Profile, BookingStatus, PracticeBooking, Contact, ContactStatus, MonthlyPackage } from '@/lib/types'

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
}

type Tab = 'bookings' | 'students' | 'practice' | 'contacts' | 'packages'

const contactStatusLabel: Record<ContactStatus, string> = {
  new: '새 문의',
  read: '확인',
  replied: '답변완료',
}

const contactStatusClass: Record<ContactStatus, string> = {
  new: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  read: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
  replied: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
}


interface Props {
  bookings: Booking[]
  students: Profile[]
  practiceBookings: PracticeBooking[]
  contacts: Contact[]
  packages: MonthlyPackage[]
}

export function AdminDashboard({ bookings, students, practiceBookings, contacts, packages }: Props) {
  const [tab, setTab] = useState<Tab>('bookings')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [practiceStatusFilter, setPracticeStatusFilter] = useState<BookingStatus | 'all'>('all')
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createState, createAction, isCreatePending] = useActionState(createPackage, null)
  const [createFormKey, setCreateFormKey] = useState(0)

  useEffect(() => {
    if (createState === 'ok') {
      setShowCreateForm(false)
      setCreateFormKey(k => k + 1)
    }
  }, [createState])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPackagePending, startPackageTransition] = useTransition()
  const [updateState, updateAction, isUpdatePending] = useActionState(updatePackage, null)
  const [updateFormKey, setUpdateFormKey] = useState(0)

  useEffect(() => {
    if (updateState === 'ok') {
      setEditingId(null)
      setUpdateFormKey(k => k + 1)
    }
  }, [updateState])

  useEffect(() => {
    setUpdateFormKey(k => k + 1)
  }, [editingId])

  const stats_data = computeBookingStats(bookings)
  const newContactCount = contacts.filter(c => c.status === 'new').length

  const stats = [
    { label: '이번 달 예약', value: String(stats_data.thisMonthCount), sub: '이번 달 전체', icon: Calendar, color: 'indigo' },
    { label: '전체 수강생', value: String(students.length), sub: '활성 수강생', icon: Users, color: 'purple' },
    { label: '이번 달 매출', value: stats_data.thisMonthRevenueFormatted, sub: '확정 레슨 기준', icon: TrendingUp, color: 'emerald' },
    { label: '대기중 예약', value: String(stats_data.pendingCount), sub: '확인 필요', icon: Clock, color: 'amber' },
    { label: '새 문의', value: String(newContactCount), sub: '미확인 문의', icon: MessageSquare, color: 'indigo' },
  ]

  const handleStatusUpdate = (id: string, status: BookingStatus) => {
    startTransition(async () => { await updateBookingStatus(id, status) })
  }

  const handlePracticeStatusUpdate = (id: string, status: BookingStatus) => {
    startTransition(async () => { await updatePracticeBookingStatus(id, status) })
  }

  const handleContactStatusUpdate = (id: string, status: ContactStatus) => {
    startTransition(async () => { await updateContactStatus(id, status) })
  }

  const filteredPractice = practiceBookings.filter(b => {
    if (practiceStatusFilter !== 'all' && b.status !== practiceStatusFilter) return false
    return true
  })

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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
          <button
            onClick={() => setTab('practice')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'practice' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            연습실 관리
          </button>
          <button
            onClick={() => setTab('contacts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'contacts' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            문의 관리
            {newContactCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">{newContactCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab('packages')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'packages' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            패키지 관리
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
                            {lessonBookingStateMachine.getAllowedTransitions(booking.status).map(target => {
                              const { label, intent } = getTransitionDescriptor(booking.status, target)
                              return booking.status === 'pending' ? (
                                <button
                                  key={target}
                                  onClick={() => handleStatusUpdate(booking.id, target)}
                                  disabled={isPending}
                                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${intent === 'confirm' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'}`}
                                  title={label}
                                >
                                  {intent === 'confirm' ? <Check size={14} /> : <X size={14} />}
                                </button>
                              ) : (
                                <button
                                  key={target}
                                  onClick={() => handleStatusUpdate(booking.id, target)}
                                  disabled={isPending}
                                  className={`text-xs font-medium disabled:opacity-40 ${intent === 'cancel' ? 'text-red-500 hover:text-red-600' : 'text-green-600 dark:text-green-400 hover:text-green-700'}`}
                                >
                                  {label}
                                </button>
                              )
                            })}
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

        {tab === 'practice' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">연습실 예약 내역</h3>
                <span className="text-sm text-gray-400">총 {filteredPractice.length}건</span>
              </div>
              <div className="relative">
                <select
                  value={practiceStatusFilter}
                  onChange={e => setPracticeStatusFilter(e.target.value as BookingStatus | 'all')}
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
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">예약자</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">연습실</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">일시</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">구분</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">금액</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">상태</th>
                      <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">액션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredPractice.map(b => (
                      <tr key={b.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isPending ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{b.booker_name}</div>
                          <div className="text-xs text-gray-400">{b.booker_phone}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {b.practice_rooms?.name ?? '-'}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {b.date} {String(b.start_hour).padStart(2, '0')}:00~{String(b.end_hour).padStart(2, '0')}:00
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.is_member ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                            {b.is_member ? '회원' : '일반'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {b.amount > 0 ? formatPrice(b.amount) : '무료'}
                        </td>
                        <td className="px-5 py-4">
                          <BookingStatusBadge status={b.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {practiceBookingStateMachine.getAllowedTransitions(b.status).map(target => {
                              const { label, intent } = getTransitionDescriptor(b.status, target)
                              return b.status === 'pending' ? (
                                <button
                                  key={target}
                                  onClick={() => handlePracticeStatusUpdate(b.id, target)}
                                  disabled={isPending}
                                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${intent === 'confirm' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'}`}
                                  title={label}
                                >
                                  {intent === 'confirm' ? <Check size={14} /> : <X size={14} />}
                                </button>
                              ) : (
                                <button
                                  key={target}
                                  onClick={() => handlePracticeStatusUpdate(b.id, target)}
                                  disabled={isPending}
                                  className={`text-xs font-medium disabled:opacity-40 ${intent === 'cancel' ? 'text-red-500 hover:text-red-600' : 'text-green-600 dark:text-green-400 hover:text-green-700'}`}
                                >
                                  {label}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPractice.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Music size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">해당하는 연습실 예약이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'contacts' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">문의 내역</h3>
                <span className="text-sm text-gray-400">총 {contacts.length}건</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">이름</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">연락처</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">이메일</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3 min-w-[200px]">문의 내용</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">상태</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">접수일</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {contacts.map(contact => {
                    return (
                      <tr key={contact.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isPending ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white text-sm whitespace-nowrap">{contact.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{contact.phone}</td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{contact.email ?? '-'}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs">
                          <p className="line-clamp-2">{contact.message}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${contactStatusClass[contact.status]}`}>
                            {contactStatusLabel[contact.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {contact.created_at.slice(0, 10)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {contactStateMachine.getAllowedTransitions(contact.status).map(target => (
                              <button
                                key={target}
                                onClick={() => handleContactStatusUpdate(contact.id, target)}
                                disabled={isPending}
                                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40"
                              >
                                {contactTransitionLabels[target] ?? target}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {contacts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">접수된 문의가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'packages' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">월정액 패키지 목록</h3>
                <span className="text-sm text-gray-400">총 {packages.length}개</span>
              </div>
              <button
                onClick={() => setShowCreateForm(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                추가
              </button>
            </div>

            {showCreateForm && (
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <form key={createFormKey} action={createAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">패키지명 *</label>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="예: 스탠다드"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">월 횟수 *</label>
                      <input
                        name="sessions"
                        type="number"
                        min={1}
                        required
                        placeholder="8"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">금액 (원) *</label>
                      <input
                        name="price"
                        type="number"
                        min={0}
                        required
                        placeholder="480000"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">혜택 (한 줄에 하나씩)</label>
                    <textarea
                      name="features"
                      rows={4}
                      placeholder={'월 8회 레슨 (주 2회)\n연습실 자유 이용 (무제한)\n교재 제공'}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  {createState && createState !== 'ok' && (
                    <p className="sm:col-span-2 text-sm text-red-500">{createState}</p>
                  )}
                  <div className="sm:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={isCreatePending}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
                    >
                      {isCreatePending ? '저장 중...' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 text-sm font-medium transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">패키지명</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">횟수</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">금액</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3 min-w-[200px]">혜택</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">인기</th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 px-5 py-3">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {packages.map(pkg => (
                    <Fragment key={pkg.id}>
                      <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isPackagePending ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-4 font-medium text-gray-900 dark:text-white text-sm">{pkg.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">월 {pkg.sessions}회</td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatPrice(pkg.price)}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <ul className="space-y-0.5">
                            {pkg.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => {
                              if (!pkg.highlighted) {
                                startPackageTransition(async () => { await setHighlightedPackage(pkg.id) })
                              }
                            }}
                            disabled={isPackagePending || pkg.highlighted}
                            title={pkg.highlighted ? '현재 인기 패키지' : '인기로 설정'}
                            className={`p-1.5 rounded-lg transition-colors ${pkg.highlighted ? 'text-yellow-500 cursor-default' : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600 dark:hover:text-yellow-400'} disabled:opacity-60`}
                          >
                            <Star size={16} fill={pkg.highlighted ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingId(editingId === pkg.id ? null : pkg.id)}
                              title="수정"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('패키지를 삭제하시겠습니까?')) {
                                  startPackageTransition(async () => { await deletePackage(pkg.id) })
                                }
                              }}
                              disabled={isPackagePending}
                              title="삭제"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingId === pkg.id && (
                        <tr>
                          <td colSpan={6} className="px-5 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800">
                            <form key={updateFormKey} action={updateAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input type="hidden" name="id" value={pkg.id} />
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">패키지명 *</label>
                                <input
                                  name="name"
                                  type="text"
                                  required
                                  defaultValue={pkg.name}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">월 횟수 *</label>
                                  <input
                                    name="sessions"
                                    type="number"
                                    min={1}
                                    required
                                    defaultValue={pkg.sessions}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">금액 (원) *</label>
                                  <input
                                    name="price"
                                    type="number"
                                    min={0}
                                    required
                                    defaultValue={pkg.price}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">혜택 (한 줄에 하나씩)</label>
                                <textarea
                                  name="features"
                                  rows={4}
                                  defaultValue={pkg.features.join('\n')}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                              </div>
                              {updateState && updateState !== 'ok' && (
                                <p className="sm:col-span-2 text-sm text-red-500">{updateState}</p>
                              )}
                              <div className="sm:col-span-2 flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isUpdatePending}
                                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
                                >
                                  {isUpdatePending ? '저장 중...' : '저장'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 text-sm font-medium transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              {packages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Music size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">패키지가 없습니다</p>
                </div>
              )}
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
