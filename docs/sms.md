# SMS 인증 설정 가이드

HobbyLink는 Supabase Auth의 전화번호 OTP 기능을 그대로 사용합니다.
`/settings/phone`에서 사용자가 번호를 입력하면 Supabase가 설정된 SMS 공급자를
통해 인증번호를 전송합니다.

## 1. 공급자 선택

Supabase는 다음 공급자를 지원합니다:

- Twilio (권장, 한국 발송 포함)
- MessageBird
- Vonage
- Textlocal

국내 SMS 발송 단가와 전화번호 포맷을 고려하여 Twilio를 기본으로 권장합니다.

## 2. Supabase 대시보드 설정

1. Supabase 프로젝트 → Authentication → Providers → Phone 활성화
2. 공급자 선택 후 API 키와 발신 번호 입력
3. Rate limit (권장 값)
   - OTP per phone: **3 / hour**
   - OTP per IP: **30 / hour**
4. Message template
   ```
   [HobbyLink] 인증번호는 {{ .Code }} 입니다. 5분 내 입력해주세요.
   ```

## 3. 로컬 개발

로컬 Supabase 스택에서는 공급자 연결 없이 Inbucket에 OTP가 로그로 남습니다.
개발용 테스트 번호는 `supabase/config.toml`에서 지정할 수 있습니다:

```toml
[auth.sms.test_otp]
"+821012345678" = "123456"
```

## 4. 비용 관리

- Supabase는 공급자 비용을 그대로 패스스루합니다.
- 악의적 OTP 폭주를 막기 위해 공급자 대시보드에서 일일 지출 한도를 설정하세요.
- 필요 시 `lib/rate-limit.ts`의 `limit('phone-otp', userId, 3, '1h')`를 서버
  액션 앞단에 추가하여 이중 방어를 둡니다.

## 5. 마이그레이션 실행

스크립트 `scripts/044_phone_verification.sql`을 배포하면:

- `profiles.phone_verified_at` 컬럼이 추가되고
- `auth.users.phone_confirmed_at`이 바뀔 때 자동으로 프로필에 미러링되며
- `public.is_phone_verified()` 함수가 RLS에서 사용 가능해집니다.

## 6. 인증 사용자에게만 허용되는 작업

RLS 예시:

```sql
create policy "Only verified users can publish paid events"
  on public.events for insert
  with check (
    price_cents = 0
    or public.is_phone_verified()
  );
```

서버 액션 예시:

```ts
import { requirePhoneVerified } from "@/lib/require-phone-verified"

export async function createPaidEvent(input: EventInput) {
  await requirePhoneVerified()
  // ... 실제 작업
}
```
