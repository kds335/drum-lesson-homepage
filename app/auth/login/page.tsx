'use client'

import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import Link from 'next/link'
import { Drum, Loader2 } from 'lucide-react'

function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const next = searchParams.get('next') ?? ''

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <form action={action} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="example@email.com"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="비밀번호 입력"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {(state?.error || urlError) && (
          <div className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{state?.error ?? urlError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          로그인
        </button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Drum className="text-indigo-600 dark:text-indigo-400" size={28} />
            <span className="font-bold text-xl text-gray-900 dark:text-white">비트스튜디오</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">로그인</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">계정으로 로그인하세요</p>
        </div>

        <Suspense fallback={<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-48" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          계정이 없으신가요?{' '}
          <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            회원가입
          </Link>
        </p>
        <p className="text-center mt-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ← 홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
