import Link from 'next/link'
import { Check, ArrowRight, Clock, Users, Wifi } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import type { LessonCategory, MonthlyPackage } from '@/lib/types'

const categoryConfig: Record<LessonCategory, { label: string; icon: React.ElementType; color: string }> = {
  individual: { label: '개인', icon: Users, color: 'indigo' },
  group: { label: '그룹', icon: Users, color: 'purple' },
  online: { label: '온라인', icon: Wifi, color: 'emerald' },
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
}


const curriculum = [
  { level: '입문', duration: '1~2개월', topics: ['올바른 자세와 그립', '기본 스트로크', '단순 박자 익히기', '간단한 리듬 패턴'] },
  { level: '기초', duration: '3~4개월', topics: ['다양한 리듬 패턴', '하이햇 컨트롤', '베이직 필인', '간단한 노래 연주'] },
  { level: '중급', duration: '5~8개월', topics: ['복합 리듬 패턴', '셔플 & 스윙', '다이나믹스 조절', '다양한 장르 연주'] },
  { level: '고급', duration: '9개월~', topics: ['즉흥 연주 (Improvisation)', '솔로 연주 구성', '메트로놈 독립', '무대 경험'] },
]

export default async function LessonsPage() {
  const supabase = await createClient()
  const [{ data: lessons }, { data: packagesData }] = await Promise.all([
    supabase.from('lessons').select('*').order('price'),
    supabase.from('monthly_packages').select('*').order('price'),
  ])
  const monthlyPackages = (packagesData ?? []) as MonthlyPackage[]

  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">레슨 소개</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg">
            다양한 레슨 유형과 합리적인 가격으로 드럼을 배워보세요
          </p>
        </div>

        {/* Lesson Types */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">레슨 종류</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(lessons ?? []).map((lesson) => {
              const config = categoryConfig[lesson.category as LessonCategory]
              const colorClass = colorMap[config.color]
              return (
                <div
                  key={lesson.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-4 ${colorClass}`}>
                    <config.icon size={12} />
                    {config.label} 레슨
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{lesson.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{lesson.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={14} />
                      {lesson.duration}분
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatPrice(lesson.price)}
                      <span className="text-xs font-normal text-gray-400 ml-1">/ 회</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Monthly Packages */}
        {monthlyPackages.length > 0 && (
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">월정액 패키지</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">월정액으로 더 알뜰하게!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {monthlyPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl p-6 border transition-all ${
                  pkg.highlighted
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-900/30 scale-105'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm'
                }`}
              >
                {pkg.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    인기
                  </div>
                )}
                <div className={`text-sm font-medium mb-1 ${pkg.highlighted ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {pkg.name}
                </div>
                <div className={`text-3xl font-bold mb-1 ${pkg.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {formatPrice(pkg.price)}
                </div>
                <div className={`text-sm mb-6 ${pkg.highlighted ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                  월 {pkg.sessions}회
                </div>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={16} className={`shrink-0 mt-0.5 ${pkg.highlighted ? 'text-indigo-200' : 'text-indigo-500'}`} />
                      <span className={pkg.highlighted ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/booking"
                  className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    pkg.highlighted
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  지금 신청하기
                </Link>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Curriculum */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">레슨 커리큘럼</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">체계적인 단계별 학습으로 확실하게 실력을 키웁니다</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {curriculum.map((c, idx) => (
              <div key={c.level} className="relative bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{c.level}</div>
                    <div className="text-xs text-gray-400">{c.duration}</div>
                  </div>
                </div>
                <ul className="space-y-1">
                  {c.topics.map((topic) => (
                    <li key={topic} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl p-10 border border-indigo-100 dark:border-indigo-900">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">아직 고민 중이신가요?</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">첫 레슨은 무료로 체험하실 수 있습니다. 부담 없이 신청해보세요!</p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            무료 체험 예약하기 <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
