'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { parseFeaturesInput } from '@/lib/parse-features'
import { highlightPackage } from '@/lib/highlight-package'

export async function createPackage(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const { supabase } = await requireAdmin()

  const name = ((formData.get('name') as string) ?? '').trim()
  const sessionsRaw = (formData.get('sessions') as string) ?? ''
  const priceRaw = (formData.get('price') as string) ?? ''
  const featuresRaw = (formData.get('features') as string) ?? ''

  if (!name) return '패키지명을 입력하세요'

  const sessions = parseInt(sessionsRaw, 10)
  if (isNaN(sessions) || sessions <= 0) return '횟수는 1 이상 정수로 입력하세요'

  const price = parseInt(priceRaw, 10)
  if (isNaN(price) || price < 0) return '금액은 0 이상 정수로 입력하세요'

  const features = parseFeaturesInput(featuresRaw)

  const { error } = await supabase
    .from('monthly_packages')
    .insert({ name, sessions, price, features, highlighted: false })
  if (error) return '패키지 생성에 실패했습니다'

  revalidatePath('/lessons')
  revalidatePath('/admin')
  return 'ok'
}

export async function updatePackage(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const { supabase } = await requireAdmin()

  const id = ((formData.get('id') as string) ?? '').trim()
  if (!id) return '패키지 ID가 없습니다'

  const name = ((formData.get('name') as string) ?? '').trim()
  const sessionsRaw = (formData.get('sessions') as string) ?? ''
  const priceRaw = (formData.get('price') as string) ?? ''
  const featuresRaw = (formData.get('features') as string) ?? ''

  if (!name) return '패키지명을 입력하세요'

  const sessions = parseInt(sessionsRaw, 10)
  if (isNaN(sessions) || sessions <= 0) return '횟수는 1 이상 정수로 입력하세요'

  const price = parseInt(priceRaw, 10)
  if (isNaN(price) || price < 0) return '금액은 0 이상 정수로 입력하세요'

  const features = parseFeaturesInput(featuresRaw)

  const { error } = await supabase
    .from('monthly_packages')
    .update({ name, sessions, price, features })
    .eq('id', id)
  if (error) return '패키지 수정에 실패했습니다'

  revalidatePath('/lessons')
  revalidatePath('/admin')
  return 'ok'
}

export async function deletePackage(id: string): Promise<void> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('monthly_packages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/lessons')
  revalidatePath('/admin')
}

export async function setHighlightedPackage(id: string): Promise<void> {
  const { supabase } = await requireAdmin()
  await highlightPackage({ supabase, id })
  revalidatePath('/lessons')
  revalidatePath('/admin')
}
