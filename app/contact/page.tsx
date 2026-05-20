'use client'

import { useActionState } from 'react'
import { Phone, Mail, MapPin, Clock, Share2, PlayCircle, Loader2, CheckCircle } from 'lucide-react'
import { submitContact } from '@/app/actions/contact'

export default function ContactPage() {
  const [state, action, pending] = useActionState(submitContact, undefined)

  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">연락처 & 오시는 길</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            궁금한 점은 언제든지 연락주세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">연락처 정보</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <Phone className="text-indigo-600 dark:text-indigo-400" size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">전화번호</div>
                    <div className="font-semibold text-gray-900 dark:text-white">010-1234-5678</div>
                    <div className="text-sm text-gray-400 mt-0.5">문자 상담 가능</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <Mail className="text-indigo-600 dark:text-indigo-400" size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">이메일</div>
                    <div className="font-semibold text-gray-900 dark:text-white">beatstudio@example.com</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <MapPin className="text-indigo-600 dark:text-indigo-400" size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">주소</div>
                    <div className="font-semibold text-gray-900 dark:text-white">서울시 마포구 홍익로 12</div>
                    <div className="text-sm text-gray-400">비트스튜디오 빌딩 3층</div>
                    <div className="text-sm text-gray-400 mt-1">우편번호: 04050</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                    <Clock className="text-indigo-600 dark:text-indigo-400" size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">운영 시간</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600 dark:text-gray-400">평일 (월~금)</span>
                        <span className="font-medium text-gray-900 dark:text-white">10:00 – 22:00</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600 dark:text-gray-400">토요일</span>
                        <span className="font-medium text-gray-900 dark:text-white">10:00 – 18:00</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600 dark:text-gray-400">일요일 / 공휴일</span>
                        <span className="font-medium text-red-500">휴무</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">소셜 미디어</div>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Share2 size={16} /> @beatstudio_drum
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-600 transition-colors"
                  >
                    <PlayCircle size={16} /> 비트스튜디오
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">빠른 문의</h2>

              {state?.success ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <CheckCircle className="text-green-500" size={40} />
                  <p className="font-semibold text-gray-900 dark:text-white">문의가 접수되었습니다!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">빠른 시일 내에 연락드리겠습니다.</p>
                </div>
              ) : (
                <form action={action} className="space-y-4">
                  {/* Honeypot — hidden from real users, bots fill it */}
                  <input
                    type="text"
                    name="website"
                    className="absolute opacity-0 -top-[9999px] -left-[9999px]"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="홍길동"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      이메일 <span className="text-gray-400 text-xs font-normal">(선택)</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@email.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      문의 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      placeholder="궁금한 점을 자유롭게 작성해주세요"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {state?.error && (
                    <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                  >
                    {pending && <Loader2 size={16} className="animate-spin" />}
                    문의 보내기
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
              {/* Map placeholder */}
              <div className="relative w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto text-indigo-500 mb-2" size={40} />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">지도 영역</p>
                  <p className="text-sm text-gray-400">서울시 마포구 홍익로 12</p>
                  <p className="text-xs text-gray-400 mt-2">카카오맵 또는 네이버지도 임베드 예정</p>
                </div>
                {/* Grid overlay for map-like appearance */}
                <div className="absolute inset-0 opacity-10">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border-b border-gray-400" style={{ height: '40px' }} />
                  ))}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">비트스튜디오 드럼교습소</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">서울시 마포구 홍익로 12, 3층</p>
                <a
                  href="https://map.kakao.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  카카오맵에서 보기
                </a>
              </div>
            </div>

            {/* Transportation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">오시는 방법</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0 text-green-700 dark:text-green-400 font-bold text-sm">
                    지
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">지하철</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      2호선 홍대입구역 3번 출구 도보 5분
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 font-bold text-sm">
                    버
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">버스</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      홍대입구역 정류장 하차<br />
                      (5714, 6714, 271 등)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-gray-700 dark:text-gray-400 font-bold text-sm">
                    차
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">자가용</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      건물 지하 주차장 이용 가능<br />
                      레슨 시 1시간 무료 주차
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900">
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">방문 전 안내사항</h3>
              <ul className="space-y-1.5 text-sm text-indigo-700 dark:text-indigo-400">
                <li>• 첫 방문 시 미리 전화 또는 온라인으로 예약해주세요</li>
                <li>• 레슨 시작 5분 전까지 도착해주시면 좋습니다</li>
                <li>• 편한 복장으로 방문해주세요</li>
                <li>• 악기는 교습소 악기를 사용하시거나 개인 스틱 지참 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
