export type MonthlyPackage = {
  name: string
  sessions: number
  price: number
  features: string[]
  highlighted: boolean
}

export const monthlyPackages: MonthlyPackage[] = [
  {
    name: '베이직',
    sessions: 4,
    price: 280000,
    features: ['월 4회 레슨 (주 1회)', '연습실 자유 이용 (월 2회)', '기초 교재 제공', '카카오톡 상담'],
    highlighted: false,
  },
  {
    name: '스탠다드',
    sessions: 8,
    price: 480000,
    features: ['월 8회 레슨 (주 2회)', '연습실 자유 이용 (무제한)', '교재 제공', '녹음 파일 제공', '카카오톡 상담'],
    highlighted: true,
  },
  {
    name: '프리미엄',
    sessions: 12,
    price: 650000,
    features: ['월 12회 레슨 (주 3회)', '연습실 자유 이용 (무제한)', '교재 + 악보 제공', '녹음 파일 제공', '1:1 커리큘럼 설계', '우선 예약권'],
    highlighted: false,
  },
]
