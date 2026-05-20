'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createBooking } from '@/app/actions/booking'
import { DAYS, getDaysInMonth, getFirstDayOfMonth, toDateString } from '@/lib/calendar'
import type { Lesson } from '@/lib/types'

interface Props {
  lessons: Lesson[]
  userName: string
  userPhone: string
}

export function BookingWizard({ lessons, userName, userPhone }: Props) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState(userPhone)
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitted, setSubmitted] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  useEffect(() => {
    if (!selectedDate) { setAvailableSlots([]); return }

    const load = async () => {
      setLoadingSlots(true)
      const supabase = createClient()
      const dayOfWeek = new Date(selectedDate).getDay()

      const [{ data: schedules }, { data: booked }] = await Promise.all([
        supabase.from('schedules').select('start_time')
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true),
        supabase.from('bookings').select('scheduled_at')
          .gte('scheduled_at', `${selectedDate}T00:00:00`)
          .lte('scheduled_at', `${selectedDate}T23:59:59`)
          .neq('status', 'cancelled'),
      ])

      const bookedTimes = (booked ?? []).map(b => (b.scheduled_at as string).slice(11, 16))
      const slots = (schedules ?? [])
        .map(s => (s.start_time as string).slice(0, 5))
        .filter(t => !bookedTimes.includes(t))
        .sort()

      setAvailableSlots(slots)
      setLoadingSlots(false)
    }

    load()
  }, [selectedDate])

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null); setSelectedTime(null)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null); setSelectedTime(null)
  }

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    if (date < new Date(today.toDateString()) || date.getDay() === 0) return
    const dateStr = toDateString(currentYear, currentMonth, day)
    setSelectedDate(dateStr)
    setSelectedTime(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLesson || !selectedDate || !selectedTime) return
    setSubmitting(true)
    setSubmitError(null)
    const result = await createBooking({
      lessonId: selectedLesson.id,
      scheduledAt: `${selectedDate}T${selectedTime}:00`,
      notes: notes || null,
    })
    setSubmitting(false)
    if (result.error) { setSubmitError(result.error); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-6">
            <Check className="text-green-600 dark:text-green-400" size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">예약 신청 완료!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            예약 신청이 접수되었습니다.<br />
            원장님 확인 후 확정 연락을 드리겠습니다.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mt-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">날짜</span>
              <span className="font-medium text-gray-900 dark:text-white">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">시간</span>
              <span className="font-medium text-gray-900 dark:text-white">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">레슨</span>
              <span className="font-medium text-gray-900 dark:text-white">{selectedLesson?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">이름</span>
              <span className="font-medium text-gray-900 dark:text-white">{name}</span>
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setSelectedDate(null); setSelectedTime(null); setSelectedLesson(null); setNotes('') }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            다른 예약하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">레슨 예약</h1>
          <p className="text-gray-500 dark:text-gray-400">원하는 날짜와 레슨 종류를 선택해 예약하세요</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(['날짜/시간 선택', '레슨 선택', '정보 입력'] as const).map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                step > idx + 1 ? 'bg-green-500 text-white' :
                step === idx + 1 ? 'bg-indigo-600 text-white' :
                'bg-gray-100 dark:bg-gray-800 text-gray-400'
              )}>
                {step > idx + 1 ? <Check size={16} /> : idx + 1}
              </div>
              <span className={cn('text-sm hidden sm:block', step === idx + 1 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400')}>
                {label}
              </span>
              {idx < 2 && <div className="w-8 h-px bg-gray-200 dark:bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {currentYear}년 {currentMonth + 1}월
                </h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className={cn('text-center text-xs font-medium py-1', d === '일' ? 'text-red-400' : 'text-gray-400')}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(currentYear, currentMonth, day)
                  const dateStr = toDateString(currentYear, currentMonth, day)
                  const isPast = date < new Date(today.toDateString())
                  const isSunday = date.getDay() === 0
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === today.toISOString().split('T')[0]
                  const disabled = isPast || isSunday

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      disabled={disabled}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded-lg text-sm transition-colors',
                        isSelected ? 'bg-indigo-600 text-white font-bold' :
                        isToday ? 'border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold' :
                        disabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' :
                        isSunday ? 'text-red-300 cursor-not-allowed' :
                        'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">일요일 및 공휴일은 예약 불가</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">시간 선택</h3>
              </div>

              {!selectedDate ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  <div className="text-center">
                    <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                    날짜를 먼저 선택해주세요
                  </div>
                </div>
              ) : loadingSlots ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 size={24} className="text-indigo-500 animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {selectedDate.replace(/-/g, '.')} 예약 가능 시간
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-medium border transition-colors',
                          selectedTime === time
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  {availableSlots.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">선택 날짜에 예약 가능한 시간이 없습니다</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Lesson Selection */}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={cn(
                  'text-left rounded-2xl p-5 border transition-all',
                  selectedLesson?.id === lesson.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{lesson.name}</h3>
                  {selectedLesson?.id === lesson.id && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 ml-2">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{lesson.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{lesson.duration}분</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{formatPrice(lesson.price)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Personal Info */}
        {step === 3 && (
          <div className="max-w-lg mx-auto">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">예약 요약</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">날짜</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">시간</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">레슨</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedLesson?.name}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">금액</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLesson && formatPrice(selectedLesson.price)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">이름 *</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">연락처 *</label>
                  <input
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">드럼 경험</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option>처음 배워요 (입문)</option>
                  <option>6개월 미만</option>
                  <option>6개월 ~ 1년</option>
                  <option>1년 이상</option>
                  <option>3년 이상</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">요청사항</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="특별히 요청하실 사항이 있으시면 입력해주세요"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
              {submitError && (
                <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                예약 신청하기
              </button>
            </form>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={16} /> 이전
            </button>
          ) : <div />}

          {step < 3 && (
            <button
              onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
              disabled={
                (step === 1 && (!selectedDate || !selectedTime)) ||
                (step === 2 && !selectedLesson)
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              다음 <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
