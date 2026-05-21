'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { contactStateMachine } from '@/lib/booking-status'
import { updateRecordStatus } from '@/lib/record-status-action'
import type { ContactStatus } from '@/lib/types'

export type ContactState = { error?: string; success?: boolean } | undefined

export async function submitContact(prevState: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot spam prevention
  const honeypot = formData.get('website') as string
  if (honeypot) return { error: '오류가 발생했습니다.' }

  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const email = (formData.get('email') as string)?.trim() || null
  const message = (formData.get('message') as string)?.trim()

  if (!name || name.length < 2) return { error: '이름을 2자 이상 입력해주세요.' }
  if (!phone) return { error: '연락처를 입력해주세요.' }
  if (!message || message.length < 5) return { error: '문의 내용을 5자 이상 입력해주세요.' }

  const supabase = await createClient()

  const { error: dbError } = await supabase.from('contacts').insert({
    name,
    phone,
    email,
    message,
  })

  if (dbError) {
    console.error('Contact DB error:', dbError)
    return { error: '문의 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }

  const contactEmail = process.env.CONTACT_EMAIL
  if (contactEmail && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Beat Studio <onboarding@resend.dev>',
        to: contactEmail,
        subject: `[비트스튜디오] 새 문의 - ${name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #4f46e5; margin-bottom: 24px;">새 문의가 접수되었습니다</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #6b7280; width: 80px; vertical-align: top;">이름</td>
                <td style="padding: 10px 0; font-weight: 600; color: #111827;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #6b7280; vertical-align: top;">연락처</td>
                <td style="padding: 10px 0; font-weight: 600; color: #111827;">${phone}</td>
              </tr>
              ${email ? `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0; color: #6b7280; vertical-align: top;">이메일</td>
                <td style="padding: 10px 0; font-weight: 600; color: #111827;">${email}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; color: #6b7280; vertical-align: top;">문의 내용</td>
                <td style="padding: 10px 0; color: #111827; white-space: pre-wrap;">${message}</td>
              </tr>
            </table>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Resend error:', emailError)
      // DB save succeeded — swallow email failure
    }
  }

  return { success: true }
}

export async function updateContactStatus(id: string, status: ContactStatus): Promise<{ error?: string; success?: boolean }> {
  return updateRecordStatus({
    table: 'contacts',
    id,
    nextStatus: status,
    stateMachine: contactStateMachine,
    revalidatePaths: ['/admin'],
  })
}
