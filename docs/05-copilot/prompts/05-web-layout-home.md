# 05 — 디자인 토큰 · 레이아웃 · 홈 화면

- **목적**: Vite + React + Tailwind 기반을 세우고, 확정된 디자인의 공통 레이아웃과 홈 화면을 구현한다.
- **선행 조건**: 01 완료 (API 없이도 진행 가능, 관광지 카드는 05에서는 `/api/spots` 호출)
- **학습 포인트**: Tailwind v4 `@theme` 토큰, URL을 상태로 쓰는 폼, 접근성 있는 토글 버튼

## 프롬프트

```text
apps/web 에 React 앱 기반과 공통 레이아웃, 홈 화면을 구현해줘.
디자인은 확정되어 있으니 문서의 구성과 토큰을 정확히 따라줘. Vercel 스타일(흰 바탕, 검정 텍스트, 1px 회색 테두리, 감색 포인트 하나)이야.

참고 문서:
#file:docs/02-design/ui-screens.md
#file:docs/02-design/design-tokens.md
#file:docs/01-product/user-flow.md
#file:docs/03-architecture/data-model.md
#file:docs/04-dev/conventions.md

설치: react, react-dom, react-router, (dev) vite, @vitejs/plugin-react, tailwindcss, @tailwindcss/vite, typescript, @types/react, @types/react-dom, vitest, @testing-library/react, @testing-library/user-event, jsdom

만들 것:
1. 기반
   - vite.config.ts: react, tailwind 플러그인, server.proxy { '/api': 'http://localhost:3000' }
   - index.html: lang="ko", Google Fonts(Geist, Geist Mono, Noto Sans KR) link, 메타 description, theme-color #FFFFFF
   - src/index.css: design-tokens.md 의 @theme 블록 그대로 + body 기본(배경 surface, 글자 ink, font-sans, antialiased)
   - src/main.tsx, src/App.tsx: React Router 라우트 / , /course , /spots/:id , * (페이지는 05에서는 Home만 구현, 나머지는 "준비 중" 자리표시)
   - package.json: "type": "module", 스크립트 dev, build(tsc --noEmit && vite build), preview, test(vitest run), typecheck(tsc --noEmit), lint(eslint src)
     (루트 npm run lint · typecheck · test 가 web 도 검사하도록. vitest · typescript · eslint 는 루트에 이미 있으니 web 에 다시 설치하지 마)
   - vitest 설정: environment jsdom, include src/**/*.test.{ts,tsx}
   - tsconfig.json: include src (+ vite.config.ts), jsx react-jsx, types 에 vite/client
2. 공통 컴포넌트 (src/components/layout, src/components/ui)
   - SiteHeader: 로고(감색 원 + 검정 꼭지 SVG, aria-hidden) + "청도 코스", 메뉴 "이용 방법"(/#how) "관광지"(/#spots), 검정 버튼 "코스 만들기". 모바일(<768px)은 햄버거 버튼(aria-label="메뉴 열기", aria-expanded)으로 메뉴 토글
   - SiteFooter: 안내 문구 + © 2026 청도 코스 (font-mono)
   - Container(최대 1200px, 좌우 24px/모바일 16px), Button(variant: primary | secondary, 최소 높이 44px), Chip, Tag, SectionLabel(모노 대문자 accent-text)
   - 아이콘: src/components/ui/icons.tsx 에 인라인 SVG(stroke, 24 viewBox) — Check, ArrowRight, Clock, MapPin, Car, Link, Copy, Sliders, Menu
3. lib
   - src/lib/query.ts: CourseQuery ↔ URLSearchParams 변환 (tags는 TAGS 순서로 정렬, 쉼표 구분). toCourseUrl(query) → "/course?hours=4&with=family&tags=nature,experience"
   - src/lib/format.ts: formatDuration(215) → "3시간 35분", formatClock(85) → "1:25"
   - src/lib/api.ts: fetchJson<T>(path) — 실패 시 { status, code, message } 를 담은 ApiError throw
   - 각 lib에 *.test.ts
4. HomePage (ui-screens.md "01 홈" 표 그대로)
   - 히어로: 격자 배경(56px, grid 색), 배지, 제목 3줄, 설명, 체크 항목 3개
   - 조건 카드: fieldset/legend 3개(01 여행 시간 3칸 그리드 + 보조문구 "가볍게 한두 곳/반나절/하루 코스", 02 동행 4칸, 03 관심사 알약 다중선택), 하단 회색 영역에 선택 요약 + 공유 URL 미리보기(code, 가로 스크롤) + "코스 만들기"
   - 선택 버튼: aria-pressed, 선택 시 bg-ink text-white, 미선택 bg-surface border-line
   - 기본값: 4시간, 가족, 관심사 [자연, 체험]. URL에 ?hours&with&tags 가 있으면 그 값으로 미리 채움
   - 관심사 0개면 버튼 비활성 + "관심사를 하나 이상 골라주세요"
   - "코스 만들기" → navigate(toCourseUrl(query))
   - HOW IT WORKS 3단, PLACES(GET /api/spots 결과 카드, 번호/권역/이름/요약/태그/체류, 클릭 시 /spots/:id), CTA
   - HomePage.test.tsx: 관심사 모두 해제 시 버튼 비활성, 선택 변경 시 공유 URL 갱신

제약:
- 색은 @theme 토큰 클래스만 (임의 hex 금지), 이모지 금지
- 그라데이션 배경, 왼쪽 굵은 테두리 카드 금지
- 상태 관리 라이브러리 추가 금지

완료 기준:
- npm test -w apps/web, npm run typecheck, npm run lint 통과
- npm run dev 후 http://localhost:5173 에서 홈 화면 확인, 관광지 카드 6개 표시(API 실행 중)
- 브라우저 폭 390px에서 가로 스크롤 없음, Tab 키로 모든 버튼 이동 가능

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유, 데스크톱/모바일 확인 결과.
```

## 리뷰 체크리스트

- [ ] `@theme` 토큰이 design-tokens.md와 일치, 컴포넌트에 hex 직접 사용 없음
- [ ] 선택 버튼이 `<button aria-pressed>`, 그룹이 `<fieldset><legend>`
- [ ] 공유 URL의 tags가 TAGS 순서로 정렬됨
- [ ] URL 쿼리로 폼 미리 채우기 동작
- [ ] 390px에서 조건 카드 그리드가 깨지지 않음 (여행 시간 3칸, 동행 4칸 유지 또는 2칸으로 접힘)
- [ ] 회색 글자가 `text-muted`(#666) 이상 진함 — `text-subtle`은 모노 라벨에만
