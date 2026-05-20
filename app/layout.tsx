import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '비트스튜디오 드럼교습소',
  description: '서울 마포구 최고의 드럼 교습소. 초보부터 고급까지 1:1 맞춤 레슨.',
  keywords: ['드럼', '드럼교습소', '드럼레슨', '음악학원', '마포구'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
