'use client'

import { usePathname } from 'next/navigation'
import { Drum, Share2, PlayCircle, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/auth')) return null
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white mb-3">
              <Drum className="text-indigo-600 dark:text-indigo-400" size={22} />
              비트스튜디오 드럼교습소
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              음악의 심장, 드럼을 함께 배워요.<br />
              초보부터 고급까지 체계적인 커리큘럼으로 가르칩니다.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-indigo-500 transition-colors"><Share2 size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-red-500 transition-colors"><PlayCircle size={20} /></a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">빠른 링크</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/lessons" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">레슨 소개 & 가격표</Link></li>
              <li><Link href="/booking" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">레슨 예약</Link></li>
              <li><Link href="/schedule" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">내 일정 확인</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">오시는 길</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">연락처</h3>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={14} className="shrink-0" />
                010-1234-5678
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                서울시 마포구 홍익로 12, 비트스튜디오 3층
              </li>
            </ul>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>평일: 10:00 – 22:00</p>
              <p>주말: 10:00 – 18:00</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
          © 2026 비트스튜디오 드럼교습소. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
