# Harness 세팅 가이드 — hobbylink

이 문서는 이 프로젝트에서 **Harness**(Claude Code용 팀 아키텍처 팩토리)를 처음 사용하는 개발자를 위한 단계별 가이드입니다.

## 0. 사전 요구사항

- **Claude Code 최신 버전** (CLI)
- **pnpm 9** (`corepack enable && corepack prepare pnpm@9 --activate`)
- 프로젝트 의존성 설치 완료 (`pnpm install`)
- `.env.local` 작성 완료 (Supabase 키)

## 1. 에이전트 팀 실험 기능 활성화

Harness는 Claude Code의 에이전트 팀 기능을 활용합니다. 환경변수로 켭니다.

### Windows PowerShell

```powershell
setx CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1
# 새 터미널을 열어 적용
```

### macOS / Linux (bash/zsh)

```bash
echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1' >> ~/.zshrc
source ~/.zshrc
```

> 프로젝트 로컬로만 적용하려면 `.claude/settings.json`의 `env` 블록을 그대로 두세요 — 이미 설정되어 있습니다.

## 2. Harness 플러그인 설치

Claude Code를 hobbylink 프로젝트 루트에서 실행한 뒤 입력합니다.

```
/plugin marketplace add revfactory/harness
/plugin install harness@harness
```

설치 확인:

```
/plugin list
```

출력에 `harness` 항목이 보이면 성공입니다.

## 3. 최초 하네스 구성

프로젝트 전체에 대한 기본 에이전트 팀을 구성하려면:

```
하네스 구성해줘
```

특정 영역에 집중한 하네스를 원한다면 도메인을 지정합니다:

```
hobbylink 매칭 기능 개선 하네스를 구성해줘.
공통 관심사 기반 스코어링과 근거리 이벤트 추천을 다듬고 싶어.
```

```
관리자 리포트/차단 처리 하네스를 구성해줘.
신고 큐, 사유 분류, 계정 조치, 감사 로그를 아우르는 팀이 필요해.
```

Harness가 아래를 수행합니다:

1. **Phase 1 — 도메인 분석.** `.claude/HARNESS_DOMAIN.md`와 `CLAUDE.md`를 읽어 컨텍스트 파악
2. **Phase 2 — 팀 아키텍처 설계.** 6가지 패턴(파이프라인 / 팬아웃·팬인 / 전문가 풀 / 생성-검증 / 감독자 / 계층적 위임) 중 선택
3. **Phase 3 — 에이전트 정의 생성** → `.claude/agents/*.md`
4. **Phase 4 — 스킬 생성** → `.claude/skills/<name>/SKILL.md` (+ `references/`)
5. **Phase 5 — 통합 및 오케스트레이션.** 메시지 프로토콜·에러 처리 결선
6. **Phase 6 — 검증.** 드라이런 + With/Without 비교 테스트

## 4. 생성된 산출물 구조

```
.claude/
├── agents/
│   ├── analyst.md          # 요구사항 분해 & 설계 설명
│   ├── builder.md          # 구현 작업 (서버 컴포넌트 / 서버 액션)
│   ├── qa.md               # Vitest + Playwright 테스트 작성/실행
│   └── reviewer.md         # 코드 리뷰 & 보안/RLS 검수
└── skills/
    ├── analyze-feature/
    │   └── SKILL.md
    ├── build-route/
    │   ├── SKILL.md
    │   └── references/
    └── verify-rls/
        └── SKILL.md
```

## 5. 팀 호출 예시

최초 구성 후 실제 작업은 다음처럼 트리거합니다:

```
/team events-nearby "반경 3km 이내 이벤트 카드에 참가자 수 배지 추가"
```

또는 자연어로:

```
events/nearby 페이지에 참가자 수 배지를 추가해줘.
빌더는 컴포넌트 작업, QA는 Playwright 시나리오, 리뷰어는 RLS 영향 체크.
```

## 6. 진화 — 더 나은 다음 세대

기능을 출시하고 난 뒤 구조적 변화를 되먹이려면:

```
/harness:evolve
```

초기 팀 아키텍처와 최종 출시 아키텍처 간 델타를 팩토리가 학습합니다 — 다음번 비슷한 도메인 생성 시 더 가까운 초안에서 시작하게 됩니다.

## 7. 트러블슈팅

| 증상                                 | 원인 / 해결                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `/plugin marketplace add` 인식 안 됨 | Claude Code 버전이 낮음. `claude update`로 최신화.                                                                |
| 팀 호출 시 "feature disabled"        | 환경변수 미적용. 터미널 재시작 후 `echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 확인.                              |
| 에이전트가 `.env.local`을 읽으려 함  | 정상 — `.claude/settings.json`의 `permissions.deny`가 차단. 필요 시 해당 agent에 테스트 전용 환경변수를 넘기세요. |
| Harness가 스택을 못 알아챔           | `CLAUDE.md`와 `.claude/HARNESS_DOMAIN.md`가 비어 있는지 확인.                                                     |

## 8. 더 읽을 것

- Harness README(KO): https://github.com/revfactory/harness/blob/main/README_KO.md
- 에이전트 팀 문서: https://code.claude.com/docs/en/agent-teams
- 관련 논문 요약: _Hwang, M. (2026). Harness: Structured Pre-Configuration for Enhancing LLM Code Agent Output Quality_ — 평균 품질 +60%, 15/15 승률, 출력 분산 -32% (저자 자체 A/B, n=15).
