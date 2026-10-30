# Copilot 프로젝트 규칙 — 청도 코스 메이커

이 저장소에서 코드를 만들거나 고칠 때 항상 아래 규칙을 따른다. 자세한 설계는 `docs/`에 있다.

## 프로젝트

청도 관광객이 여행 시간 · 동행 · 관심사를 고르면 방문 순서와 이동 시간이 포함된 코스를 추천하는 웹 서비스.
설계 문서가 기준이다. 문서와 다르게 구현해야 할 이유가 있으면 코드를 바꾸기 전에 먼저 알려라.

- 기능: `docs/01-product/mvp-spec.md`
- 화면: `docs/02-design/ui-screens.md`, `docs/02-design/design-tokens.md`
- API: `docs/03-architecture/api-spec.md`
- 타입: `docs/03-architecture/data-model.md`
- 추천 로직: `docs/03-architecture/recommendation-algorithm.md`
- 코드 규칙: `docs/04-dev/conventions.md`

## 스택 (임의로 바꾸지 말 것)

- npm workspaces 모노레포: `apps/web`, `apps/api`, `packages/shared`
- TypeScript (strict), Node.js 22
- Web: React + Vite + React Router + Tailwind CSS v4
- API: Express 5 + zod + pino, 데이터는 `apps/api/data/spots.json` (DB 없음)
- 빌드: web은 Vite, api는 tsup 번들(shared 포함 → `dist/index.js`). `tsc`는 타입 검사(`--noEmit`) 전용 (`docs/00-overview/decisions/0004-api-build-tsup.md`)
- 테스트: Vitest + Supertest
- 배포: Docker (web = nginx 정적 서빙, api = node), Docker Compose

새 라이브러리를 추가해야 하면 이유를 먼저 설명하고 허락을 받는다.

## 코드 규칙

- 타입 · 상수 · zod 스키마는 `@cheongdo/shared`에서 import. 같은 정의를 다시 만들지 않는다.
- `any` 금지. named export 사용.
- 파일명: kebab-case, React 컴포넌트 파일만 PascalCase.
- API 계층: `routes`(요청 · 응답 변환) → `domain`(순수 로직) / `data`(저장소). `domain`은 Express · fs · env를 모른다.
- 오류는 `HttpError`를 던지고 공통 에러 미들웨어가 `{ error: { code, message, details } }`로 응답한다.
- `createApp(deps)`로 앱을 만들고 `index.ts`에서만 `listen` 한다 (테스트용 분리).
- 화면 문구는 한국어 해요체. 이모지 금지. 아이콘은 인라인 SVG(stroke).
- 색 · 글꼴 · 반경은 `index.css`의 `@theme` 토큰만 사용 (`bg-surface`, `text-muted`, `border-line`, `text-accent-text` 등). 임의 hex 값 금지.
- 접근성: 선택 버튼은 `<button aria-pressed>`, 그룹은 `<fieldset>`+`<legend>`, 아이콘 버튼은 `aria-label`, 터치 영역 44px 이상.

## 작업 방식

- 한 번에 요청된 범위만 바꾼다. 관련 없는 파일을 리팩터링하지 않는다.
- 로직을 바꾸면 테스트를 같이 추가 · 수정한다.
- 끝나면 `npm run lint`, `npm run typecheck`, `npm test`를 실행하고 결과를 보고한다.
- 보고 형식: ① 변경한 파일 목록 ② 실행한 명령과 결과 ③ 문서와 다르게 한 부분과 이유 ④ 남은 할 일.

## 하지 말 것

- 비밀 값 · `.env` 커밋, 하드코딩
- `spots.json`에 확인되지 않은 운영시간 · 요금 지어내기
- 추천 알고리즘에서 난수 · 현재 시각 사용 (결과가 결정적이어야 함)
- `infra/`, `.github/workflows/` 수정 (배포 영역은 사람이 직접 작업한다. 프롬프트에서 명시한 경우만 예외)
