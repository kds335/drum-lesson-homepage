import Link from 'next/link'
import { ArrowRight, Music, Users, Award, Clock, Star, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: Music,
    title: '체계적인 커리큘럼',
    description: '기초부터 고급까지 단계별로 설계된 커리큘럼으로 실력을 빠르게 키울 수 있습니다.',
  },
  {
    icon: Users,
    title: '소수 정예 레슨',
    description: '1:1 개인 레슨과 소규모 그룹 레슨으로 꼼꼼한 피드백을 받을 수 있습니다.',
  },
  {
    icon: Award,
    title: '전문 강사진',
    description: '10년 이상의 경력을 보유한 전문 드러머가 직접 지도합니다.',
  },
  {
    icon: Clock,
    title: '유연한 스케줄',
    description: '평일 오전부터 저녁까지, 주말에도 원하는 시간에 예약할 수 있습니다.',
  },
]

const reviews = [
  {
    name: '김민준',
    date: '2026.04',
    rating: 5,
    text: '처음 드럼을 배우기 시작했는데 원장님이 정말 친절하게 알려주셔서 빠르게 실력이 늘었어요!',
  },
  {
    name: '이서연',
    date: '2026.03',
    rating: 5,
    text: '다른 학원도 다녀봤지만 여기가 제일 체계적이에요. 온라인 예약 시스템도 편리합니다.',
  },
  {
    name: '박지호',
    date: '2026.02',
    rating: 5,
    text: '6개월 만에 밴드 합주까지 할 수 있게 됐어요. 강추합니다!',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900" />
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-20 left-[5%] w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-white">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 mb-6 animate-fade-in-up">
              🥁 서울 마포구 No.1 드럼 교습소
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in-up animation-delay-200">
              리듬으로 하나되는
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                비트스튜디오
              </span>
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed animate-fade-in-up animation-delay-400">
              초보자부터 전문가까지, 나만의 속도로 드럼을 배워보세요.
              <br />
              체계적인 1:1 맞춤 레슨으로 빠르게 성장할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-600">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-900/50"
              >
                무료 체험 신청하기
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/lessons"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-all hover:scale-105"
              >
                레슨 알아보기
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { value: '500+', label: '수강생' },
              { value: '10년+', label: '강사 경력' },
              { value: '98%', label: '재등록률' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">왜 비트스튜디오인가요?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">최고의 환경에서 최상의 레슨을 경험해보세요</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4">
                  <feature.icon className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="w-full aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-8xl">
                🥁
              </div>
              <div className="absolute -bottom-4 -right-4 bg-indigo-600 text-white rounded-2xl px-4 py-3 shadow-lg">
                <div className="text-2xl font-bold">10년+</div>
                <div className="text-xs text-indigo-200">전문 경력</div>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">원장 소개</span>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-4">이진호 원장</h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                <p>홍익대학교 음악대학 실용음악과 졸업 (드럼 전공)</p>
                <p>전 프로 드러머 활동 (재즈, 록, 팝 장르)</p>
                <p>다수의 방송 및 공연 세션 참여</p>
                <p>드럼 강사 경력 10년 이상, 누적 수강생 500명+</p>
              </div>
              <blockquote className="border-l-4 border-indigo-500 pl-4 text-gray-700 dark:text-gray-300 italic">
                &quot;모든 음악의 중심에는 리듬이 있습니다. 드럼을 통해 여러분만의 리듬을 찾아드리겠습니다.&quot;
              </blockquote>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                레슨 신청하기 <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">수강생 후기</h2>
            <p className="text-gray-500 dark:text-gray-400">실제 수강생들의 생생한 경험담</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.name} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{review.text}</p>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">{review.name}</span>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-10 shadow-2xl shadow-indigo-900/30">
            <h2 className="text-3xl font-bold text-white mb-4">지금 바로 시작해보세요</h2>
            <p className="text-indigo-200 mb-8">첫 레슨은 무료 체험으로 진행됩니다. 부담 없이 방문해보세요!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
              >
                무료 체험 예약 <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-500/30 text-white font-semibold border border-indigo-400/40 hover:bg-indigo-500/40 transition-colors"
              >
                전화 문의하기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
