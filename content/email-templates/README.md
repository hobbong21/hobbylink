# 이메일 템플릿

Resend·트랜잭션 이메일에서 사용하는 템플릿입니다. 각 파일은 다음 구조:

- `subject` — 제목
- `preheader` — 메일 미리보기 (첫 40자)
- `html` — 인라인 CSS로 렌더링된 최종본
- `text` — HTML 미지원 클라이언트용 평문

## 브랜드 규칙

- 색상: primary `#2B4CFF` (트러스트 블루), muted `#64748B`
- 폰트: system fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, sans-serif`) — 커스텀 폰트는 이메일에서 로딩 불안정
- 최대 너비: 600px
- 모든 CTA 버튼은 bulletproof (background + table fallback)
- 푸터에 unsubscribe 링크 **필수** (CAN-SPAM·KISA 고시)

## 목록

| 파일 | 언제 발송 | 수신자 |
|---|---|---|
| `welcome.ko.html` | 회원가입 + 이메일 인증 후 | 신규 회원 |
| `welcome.en.html` | 영문 사용자 동일 | 영문 수신자 |
| `event-reminder.ko.html` | 참여 모임 24h 전 | 참가자 |
| `event-cancellation.ko.html` | 모임 취소 시 | 참가자 |
| `weekly-digest.ko.html` | 매주 월 09:00 | 전체 활성 사용자 |
| `password-reset.ko.html` | 비밀번호 재설정 요청 | 요청자 |
| `phone-otp.txt` | 전화 인증 코드 (SMS 평문) | 요청자 |

## 변수

모든 템플릿에서 사용하는 공용 변수:

- `{{user_name}}` — 수신자 display_name
- `{{site_url}}` — `https://hobbylink.kr`
- `{{unsubscribe_url}}` — `{{site_url}}/unsubscribe?t={{token}}`
- `{{year}}` — 푸터 저작권 연도

## 발송 후 체크

- 주간 바운스율 < 2%
- 주간 불만율 (complaint rate) < 0.1%
- Resend 대시보드에서 `domain reputation` 녹색 유지
