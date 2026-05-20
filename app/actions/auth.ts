'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export type AuthState = { error?: string; message?: string } | undefined

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string | null) ?? ''
  const safeTo = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.code === 'invalid_credentials') {
      return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
    if (error.code === 'email_not_confirmed') {
      return { error: '이메일 인증이 완료되지 않았습니다. 가입 시 발송된 이메일을 확인해주세요.' }
    }
    return { error: error.message }
  }

  redirect(safeTo)
}

export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const full_name = (formData.get('full_name') as string)?.trim()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!full_name || full_name.length < 2) {
    return { error: '이름은 2자 이상 입력해주세요.' }
  }
  if (!email) {
    return { error: '이메일을 입력해주세요.' }
  }
  if (!password || password.length < 6) {
    return { error: '비밀번호는 6자 이상이어야 합니다.' }
  }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return { error: '이미 등록된 이메일입니다.' }
    }
    if (error.code === 'signup_disabled') {
      return { error: '현재 회원가입이 제한되어 있습니다. 관리자에게 문의해주세요.' }
    }
    return { error: error.message }
  }

  return { message: '회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}
