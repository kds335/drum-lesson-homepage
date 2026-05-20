# 비트스튜디오 드럼교습소

## 행동 원칙
- 코딩 전 가정 사항 명시, 불확실하면 질문
- 요청한 것만 구현, 추측 기능 추가 금지
- 기존 코드 스타일 유지, 관련 없는 코드 건드리지 않기
- redirect()는 try/catch 밖에서 호출

## 스택
- Next.js 16 (App Router) — Breaking changes 많음, node_modules/next/dist/docs/ 확인
- Tailwind CSS v4 — @custom-variant dark 방식, v3 문법 금지
- Supabase — @supabase/ssr / 브라우저: lib/supabase/client.ts / 서버: lib/supabase/server.ts
- React 19 — useActionState는 react에서 import

## Next.js 16 변경점
- middleware.ts → proxy.ts (export도 middleware → proxy)
- params, searchParams 모두 Promise<...> — await 필요

## 핵심 파일
| 파일 | 역할 |
|---|---|
| proxy.ts | 세션 갱신 |
| app/actions/auth.ts | 로그인·회원가입·로그아웃 |
| app/auth/callback/route.ts | 이메일 인증 콜백 |
| lib/dummy-data.ts | 더미 데이터 (미완성 페이지용) |
| supabase/schema.sql | DB 스키마 |

## DB
profiles · lessons · schedules · bookings — RLS 활성화, get_user_role()로 admin 체크