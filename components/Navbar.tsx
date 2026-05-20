'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Drum, Menu, X, LogOut, User } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/lessons', label: '레슨 소개' },
  { href: '/booking', label: '레슨 예약' },
  { href: '/practice', label: '연습실 예약' },
  { href: '/schedule', label: '내 일정' },
  { href: '/contact', label: '오시는 길' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (pathname.startsWith('/auth')) return null

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push('/auth/login')
    router.refresh()
  }

  const displayName = user?.user_metadata?.full_name as string | undefined

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
          <Drum className="text-indigo-600 dark:text-indigo-400" size={24} />
          <span>비트스튜디오</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            관리자
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <User size={16} />
                  <span className="max-w-[80px] truncate">{displayName ?? user.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <LogOut size={14} />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/admin" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-gray-500">관리자</Link>
          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 pt-2">
            {user ? (
              <button
                onClick={() => { setOpen(false); handleLogout() }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <LogOut size={14} />
                로그아웃 ({displayName ?? user.email})
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/login" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 rounded-lg text-sm text-center font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  로그인
                </Link>
                <Link href="/auth/signup" onClick={() => setOpen(false)} className="flex-1 px-3 py-2 rounded-lg text-sm text-center font-medium bg-indigo-600 text-white">
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
