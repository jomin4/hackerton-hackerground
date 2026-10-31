# 하루 코스 v2 구현 계획

> **실행 방식:** 기존과 같은 Copilot CLI 루프. Task마다 Claude가 `prompts/NN-*.md`를 쓰고 → Copilot이 구현 → Claude가 리뷰(검사 재실행 · 반례 탐침) → PR 머지. 데이터 Task(D)는 Claude가 작성하고 소유자가 PR에서 확인한다. 진행 표시는 체크박스(`- [ ]`).

**Goal:** 자가용 당일 관광객이 사이트 일정만 보고 청도에서 하루(관광 · 점심 · 쉬어 가기 · 저녁 · 야간 관광)를 보낼 수 있게 한다.

**Architecture:** 장소 데이터는 JSON(`apps/api/data/spots.json`) + 시작 시 zod 검증 · 메모리 로드를 유지한다. 이동 시간은 좌표 하버사인 거리로, 영업 여부는 요일별 구조화 운영시간으로 계산하는 순수 함수 `planDay`가 기존 `recommendCourse`를 대체한다. 웹은 날짜 · 시각 입력과 시각 타임라인으로 바뀐다.

**Tech Stack:** 기존 그대로 — npm workspaces, TypeScript, zod 4, Express 5, React + Vite + Tailwind v4, vitest. 새 라이브러리 없음 (날짜 계산도 표준 `Date` UTC 연산으로).

**Spec:** [`../01-product/day-course-design.md`](../01-product/day-course-design.md) (승인 2026-10-31) · 데이터 조사 [`../01-product/data-sources-research.md`](../01-product/data-sources-research.md)

## 브랜치 전략

v2는 shared 타입이 바뀌어 api · web이 한꺼번에 깨진다. 그래서 **통합 브랜치 `feat/day-course-v2`**를 만들고 Task별 PR은 이 브랜치로 머지한다.

- Task별 PR: 그 Task가 건드린 워크스페이스의 타입 · 린트 · 테스트 · 포맷이 통과하면 머지. 아직 안 옮긴 워크스페이스의 타입 오류는 허용 (PR 설명에 적음).
- 마지막 Task 11에서 `feat/day-course-v2` → `main` PR. 이때는 **전체** 검사 + Docker 리허설 통과 필수.
- 예외: Task 1(수집 도구)은 앱과 무관하므로 `main`에 바로 머지.

## Global Constraints

- 서비스 동작 중 TourAPI 호출 금지. TourAPI 응답 원문 · 원문 소개 글을 저장소에 넣지 않는다. 수집물은 `.data-draft/`(git 제외)에만.
- 사진은 `license: 'kogl-1'`만, 원본 URL(`tong.visitkorea.or.kr`)을 그대로 쓰고 자르거나 바꾸지 않는다. 출처 문구 표시 필수.
- 출처 표기: 푸터 "데이터 제공: ⓒ한국관광공사".
- 모든 장소에 `hours`(구조화) · `checkedAt` · `location` 필수. 확인 안 된 장소는 넣지 않는다.
- 결정적: 같은 쿼리 → 같은 응답. 쿼리 검증에 "오늘" 같은 현재 시각을 쓰지 않는다.
- 요일은 `date` 문자열의 달력 날짜로 계산 (서버 시간대와 무관).
- 사용자에게 보이는 문구 · 오류 메시지는 한국어. 이모지 금지. 색은 토큰 클래스만.
- 접근성: 선택 버튼 `<button aria-pressed>`, 그룹 `fieldset/legend`, 터치 44px, 글자 12px 이상, `outline-none` 금지, 새 탭 링크 `rel="noopener noreferrer"`.
- 390px 폭에서 가로 스크롤 없음.
- 상수(설계 6장): 이동 `roadFactor 1.4`, `speedKmh 40`, `overheadMinutes 5`, 5분 단위 올림 / 점심 도착 창 `11:30–13:30` / 저녁 도착 창 `17:30–19:00` / 식사 60분 / 시작 후보 5곳 / 이동 가중치 0.5 / `start` 08:00–14:00, `end` ≤ 21:00, `end − start` ≥ 3시간, 둘 다 30분 단위 / 점심 조건 `start ≤ 12:00 && end ≥ 14:00` / 저녁 조건 `end ≥ 18:30`.

## Review Focus

설계가 직접 말하지 않지만 사용자를 가장 먼저 물 만한 입력 다섯 가지. 각 줄의 테스트는 해당 Task에 넣었다.

1. **없는 날짜** `date=2026-02-30` · `2026-13-01` → 형식은 맞아도 400 "방문 날짜가 올바르지 않아요." (Task 3)
2. **서버 시간대와 요일** — UTC 서버에서도 `weekdayOf('2026-11-09') === 'mon'`, `weekdayOf('2026-11-07') === 'sat'` (Task 3)
3. **쉬는 시간 사이 도착** — 식당 `11:00–14:30, 17:00–21:00`에 15:00 도착 → 17:00까지 기다리거나(창 안이면) 다른 곳 선택. 15:00 영업으로 보면 안 됨 (Task 5)
4. **마감 직전 도착** — 17:30 도착, 마감 18:00, 체류 40분 → 그 장소는 넣지 않음. `lastEntryBeforeCloseMinutes: 15`이면 17:46 도착도 불가 (Task 5)
5. **그 요일에 연 식당이 없음** — 월요일에 모든 식당 휴무 → 점심 · 쉬어 가기 없이 관광만, `notices`에 "이 시간에 영업하는 식당을 찾지 못했어요" (Task 5)

---

### Task 1: TourAPI 수집 도구 (프롬프트 10, `main`에 직접)

**Files:**
- Create: `tools/tourapi/collect.mjs`, `tools/tourapi/candidates.mjs`, `tools/tourapi/README.md`
- Modify: `.gitignore` (`.data-draft/` 추가), `.dockerignore` (`tools`, `.data-draft` 추가)

**Interfaces:**
- Produces: `.data-draft/tourapi-cheongdo.json` = `{ collectedAt, source: 'TourAPI KorService2', total, items: [{ list, common, intro, info, images }] }` (contentid 오름차순), `.data-draft/candidates.md` (종류 · 읍면 · 1유형 사진 수 · 운영시간 원문 요약 표)

- [ ] **Step 1:** `collect.mjs` — `.env`의 `TOUR_API_KEY`(Decoding 키)로 `areaBasedList2`(`lDongRegnCd=47`, `lDongSignguCd=820`, `numOfRows=300`) → 항목마다 `detailCommon2` · `detailIntro2` · `detailInfo2` · `detailImage2(imageYN=Y)`. 동시 3개, 실패 시 최대 3회 재시도, `resultCode !== '0000'`이면 중단. 키를 로그에 찍지 않는다. 의존성 없이 Node 22 `fetch`.
- [ ] **Step 2:** `candidates.mjs` — 초안을 읽어 `kind` 후보(12 · 14 → spot, 28 중 캠핑 제외, 39 중 `lclsSystm3=FD050100` → cafe, 나머지 39 → restaurant) · 주소의 읍면 · `cpyrhtDivCd=Type1` 이미지 수 · 운영시간 원문 앞 60자 표를 마크다운으로 쓴다.
- [ ] **Step 3: 확인** — `node tools/tourapi/collect.mjs` → "done: 133 items" (2026-10-31 수집과 같은 건수), `git status`에 `.data-draft/` 안 보임.
- [ ] **Step 4:** 루트 lint · prettier 통과 후 PR → `main` 머지.

### Task 2 (D): 장소 선정 (Claude 초안 → 소유자 확인)

- [ ] **Step 1:** `candidates.md`에서 설계 5장 기준으로 관광 25~30 · 식당 7~8 · 카페 7~8 선정. 야간 영업 관광지 2곳 이상, 운문면 · 화양읍 · 청도읍에 식당 · 카페 각 1곳 이상.
- [ ] **Step 2:** `docs/01-product/spots-data.md`를 v2로 다시 쓴다: 원칙(설계 3 · 5장), 권역 9개, **선정 목록 표**(id · kind · 이름 · zone · contentId · 1유형 사진 유무 · 선정 이유).
- [ ] **Step 3:** 소유자에게 목록 확인 요청. 확인 후 `feat/day-course-v2` 브랜치 생성, 이 문서를 첫 커밋으로.

### Task 3: shared v2 — 상수 · 타입 · 스키마 · 시각 도우미 (프롬프트 11)

**Files:**
- Modify: `packages/shared/src/constants.ts`, `types.ts`, `schemas.ts`, `index.ts`
- Create: `packages/shared/src/time.ts`, `packages/shared/src/hours-format.ts`
- Test: `packages/shared/src/schemas.test.ts`, `time.test.ts`, `hours-format.test.ts`

**Interfaces:**
- Produces (constants): `KINDS = ['spot','restaurant','cafe']`, `Kind` · `WEEKDAYS = ['mon',…,'sun']`, `Weekday`, `WEEKDAY_LABELS` (`월`…`일`) · `ZONES`(9개, 설계 5장 순서) + `ZONE_LABELS`(청도읍 · 화양읍 · 이서면 · 각남면 · 풍각면 · 각북면 · 운문면 · 금천면 · 매전면) · `TRAVEL = { roadFactor: 1.4, speedKmh: 40, overheadMinutes: 5, roundTo: 5 }` · `MEAL_WINDOWS = { lunch: { from: '11:30', to: '13:30' }, dinner: { from: '17:30', to: '19:00' } }` · `MEAL_MINUTES = 60` · `DAY_LIMITS = { startMin: '08:00', startMax: '14:00', endMax: '21:00', minSpanMinutes: 180, stepMinutes: 30, lunchStartMax: '12:00', lunchEndMin: '14:00', dinnerEndMin: '18:30' }` · `START_CANDIDATES = 5` · `TRAVEL_WEIGHT = 0.5` · `DATA_ATTRIBUTION = '데이터 제공: ⓒ한국관광공사'`. 삭제: `HOURS`, `TRAVEL_MINUTES`, `UNVERIFIED_SOURCE`.
- Produces (types): 설계 5장 `TimeRange` · `WeeklyHours` · `SpotImage` · `Spot`, `SpotSummary = Pick<Spot,'id'|'kind'|'name'|'summary'|'zone'|'tags'|'stayMinutes'|'location'> & { image?: SpotImage }`, 설계 6장 `DayQuery { date; start; end; with; tags; exclude }`, `DayPlanItem`, `DayPlan` (`conditions: DayQuery & { weekday: Weekday }`), `ExcludedReason = 'NOT_ENOUGH_TIME' | 'CLOSED_ON_DAY'`. 삭제: `OpeningHours`, `CourseQuery`, `CourseStop`, `CourseTotals`, `Course`.
- Produces (time.ts): `toMinutes(clock: string): number` ("09:30" → 570), `toClock(minutes: number): string` (570 → "09:30"), `weekdayOf(date: string): Weekday`, `isValidDate(date: string): boolean`.
- Produces (hours-format.ts): `formatWeeklyHours(hours: WeeklyHours): string[]` — 같은 시간 요일을 묶은 줄 목록 (예: `['화~일 09:30–18:00', '월 휴무']`).
- Produces (schemas): `spotSchema` · `spotsFileSchema`(설계 5장 검증 규칙 전부), `dayQuerySchema`(문자열 쿼리 → `DayQuery`), `spotsQuerySchema`(+ `kind`).

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// time.test.ts
expect(toMinutes('09:30')).toBe(570); expect(toClock(570)).toBe('09:30'); expect(toClock(1260)).toBe('21:00');
expect(weekdayOf('2026-11-07')).toBe('sat'); expect(weekdayOf('2026-11-09')).toBe('mon'); // Review Focus 2
expect(isValidDate('2026-02-30')).toBe(false); expect(isValidDate('2026-13-01')).toBe(false); expect(isValidDate('2028-02-29')).toBe(true);

// schemas.test.ts — dayQuerySchema
parse({ date:'2026-11-07', start:'10:00', end:'19:00', with:'family', tags:'nature,experience' })
  → { date:'2026-11-07', start:'10:00', end:'19:00', with:'family', tags:['nature','experience'], exclude:[] }
'2026-02-30' · date 누락 → 오류 메시지 '방문 날짜가 올바르지 않아요.'        // Review Focus 1
start '07:30' / '14:30' / '10:15' → '시작 시각은 08:00~14:00 사이 30분 단위로 골라주세요.'
end '21:30' / '12:30'(start 10:00) → '끝 시각은 시작보다 3시간 이상 늦고 21:00 이전이어야 해요.'
tags '' → '관심사를 하나 이상 골라주세요.'  (기존 문구 유지)

// schemas.test.ts — spotSchema (유효한 기본 장소 하나를 만들고 한 필드씩 바꿔 실패 확인)
open '18:00' close '09:00' → 실패 / 같은 요일 구간 겹침 → 실패 / kind restaurant + meals 없음 → 실패
kind spot + tags [] → 실패 / location lat 37.5 → 실패 / images[].license 'kogl-3' → 실패 / checkedAt 없음 → 실패
spotsFileSchema: id 중복 → 실패

// hours-format.test.ts
mon:[] 나머지 09:30–18:00 → ['화~일 09:30–18:00', '월 휴무']
매일 09:00–18:00 → ['매일 09:00–18:00']
tue 11:00–14:30, 17:00–21:00 · 나머지 휴무 → ['화 11:00–14:30, 17:00–21:00', '월·수~일 휴무'] 형태 (연속 요일은 ~, 떨어진 요일은 ·)
```

- [ ] **Step 2:** `npm test -w packages/shared` → 새 테스트 FAIL 확인
- [ ] **Step 3:** 구현. `weekdayOf`는 `Date.UTC(y, m-1, d)`의 `getUTCDay()`로. `isValidDate`는 UTC로 만든 날짜의 연 · 월 · 일이 입력과 같은지.
- [ ] **Step 4:** `npm test -w packages/shared` · `npm run typecheck -w packages/shared` PASS (api · web 타입 오류는 이 단계에서 허용)
- [ ] **Step 5:** PR → `feat/day-course-v2`

### Task 4 (D): 장소 데이터 확인 · 작성

**Files:** Modify: `apps/api/data/spots.json` (전체 교체) · Test: `apps/api/test/data/spots-file.test.ts`

- [ ] **Step 1:** Task 2 목록 순서대로, 장소마다 초안 + 공식 페이지 대조 → 설계 5장 `Spot` v2 작성. 소개 · 팁 · alt는 우리 문장, `hours`는 구조화(상시 개방은 추천 관람 시간 + note), `checkedAt`은 확인한 날짜, 사진은 Type1만, `sourceRef.contentId` 기록. 운문사는 공식 페이지 기준 작성.
- [ ] **Step 2:** `spots-file.test.ts`를 v2로: 파일이 `spotsFileSchema` 통과 · kind별 개수(관광 25~30, 식당 7~8, 카페 7~8) · 야간(19:00 이후 영업) 관광 2곳 이상 · 운문면 · 화양읍 · 청도읍에 식당 · 카페 각 1곳 이상.
- [ ] **Step 3:** `npx vitest run test/data` (apps/api) PASS
- [ ] **Step 4:** PR → `feat/day-course-v2`. PR 설명에 출처 간 불일치 · 상시 개방 추천 시간 근거 표. **소유자 확인 후 머지.**

### Task 5: 일정 계산 `planDay` (프롬프트 12)

**Files:**
- Create: `apps/api/src/domain/travel.ts`, `apps/api/src/domain/opening.ts`, `apps/api/src/domain/plan-day.ts`
- Delete: `apps/api/src/domain/recommend-course.ts`, `apps/api/test/domain/recommend-course.test.ts`
- Test: `apps/api/test/domain/travel.test.ts`, `opening.test.ts`, `plan-day.test.ts`; Modify: `apps/api/test/fixtures/spots.ts` (v2 픽스처로 교체)

**Interfaces:**
- Consumes: Task 3 상수 · 타입 · `toMinutes` · `toClock` · `weekdayOf`
- Produces: `haversineKm(a: {lat;lng}, b: {lat;lng}): number` · `travelMinutes(km: number): number` (0km → 0, 그 외 `ceil5(km × 1.4 ÷ 40 × 60 + 5)`) · `fitVisit(spot: Spot, weekday: Weekday, arriveMinute: number, stayMinutes: number): { arriveMinute: number; waitMinutes: number } | null` (영업 구간 안에서 체류를 마칠 수 있는 가장 이른 도착, 입장 마감 반영, 불가면 null) · `planDay(spots: Spot[], query: DayQuery): DayPlan`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// travel.test.ts — 기준값 (Claude 계산)
haversineKm({lat:35.65,lng:128.73},{lat:35.70,lng:128.73}) ≈ 5.560 (±0.01) → travelMinutes 20
haversineKm({lat:35.65,lng:128.73},{lat:35.65,lng:128.75}) ≈ 1.807 → 10
haversineKm({lat:35.65,lng:128.73},{lat:35.651,lng:128.73}) ≈ 0.111 → 10
travelMinutes(0) → 0

// opening.test.ts  (hours: 매일 09:00–18:00, lastEntry 15)
fitVisit(s,'sat', 480, 40) → { arriveMinute: 540, waitMinutes: 60 }   // 08:00 도착 → 09:00까지 기다림
fitVisit(s,'sat',1050, 40) → null                                     // 17:30 도착 + 40분 > 18:00   (Review Focus 4)
fitVisit(s,'sat',1066, 10) → null                                     // 17:46 > 마감 15분 전
fitVisit(restaurantWithBreak,'tue', 900, 60) → { arriveMinute: 1020, waitMinutes: 120 } // 15:00 → 17:00 (Review Focus 3)
fitVisit(s,'mon', 600, 30) → null  (mon: [])
```

`plan-day.test.ts`: 픽스처(관광 6 · 식당 3 · 카페 2, 좌표 · 운영시간을 테스트 안에서 정의)로 아래 시나리오. **각 시나리오의 정확한 `items`(id · arriveAt · leaveAt) 기대값은 프롬프트 12 파일에 Claude가 손으로 계산해 고정한다.** 공통으로 모든 시나리오에서 확인할 성질:
- `items`의 시각이 겹치지 않고, `arriveAt` = 이전 `leaveAt` + `travelMinutes` + `waitMinutes`, 마지막 `leaveAt` ≤ `end`
- 모든 항목이 그 요일 영업시간 안
- 같은 쿼리를 두 번 → `toEqual`, 입력 배열 순서를 뒤집어도 같은 결과, 입력 배열을 바꾸지 않음

| 시나리오 | 쿼리 | 고정할 성질 |
|---|---|---|
| S1 기본 하루 | 토 10:00–19:00 family nature,experience | 점심 도착 11:30~13:30, 바로 다음이 카페(rest), 저녁 18:30 조건 충족 시 저녁 포함 |
| S2 개장 전 기다림 | 토 08:00–14:00 | 첫 항목 `waitMinutes` > 0, `arriveAt` = 개장 시각 |
| S3 늦은 출발 | 토 12:30–18:00 | `meal: 'lunch'` 없음 |
| S4 야간 관광 | 토 10:00–21:00 | 저녁 뒤 19:00 이후 영업 관광지가 visit로 포함 |
| S5 월요일 휴무 | 월 10:00–17:00 | 월 휴무 관광지는 `excluded`에 `CLOSED_ON_DAY` |
| S6 식당 전부 휴무 | 월, 식당 3곳 mon:[] | lunch · rest 없음, `notices`에 '이 시간에 영업하는 식당을 찾지 못했어요' (Review Focus 5) |
| S7 보충 후보 | 혼자 history (태그 맞는 곳 1곳) | 태그 맞는 곳을 먼저 넣고, 남는 시간에 동행만 맞는 곳(score 5) 포함 |
| S8 exclude | S1 + exclude=첫 장소 id | 그 장소 없음, `excluded`에도 없음 |

- [ ] **Step 2:** `npx vitest run test/domain` (apps/api) → FAIL
- [ ] **Step 3:** 구현 — 설계 6장 "계산 순서 0~7"을 그대로. 식사 삽입 판단: 다음 관광 후보를 넣으면 `leaveAt + 식당까지 이동`이 식사 창 `to`를 넘는지로 본다. 식당 · 카페 선택은 이동분↑ → id↑. 시작 후보 5개 일정 중 관광 점수 합이 큰 것 → 총 이동분이 작은 것 → 시작 장소 id 오름차순.
- [ ] **Step 4:** `npx vitest run test/domain` PASS
- [ ] **Step 5:** PR → `feat/day-course-v2`

### Task 6: API v2 (프롬프트 13)

**Files:** Modify: `apps/api/src/routes/course.ts`, `routes/spots.ts`, `data/spot-repository.ts`(타입만) · Test: `test/routes/course.test.ts`, `spots.test.ts`, `errors.test.ts`, `health.test.ts`

**Interfaces:**
- Consumes: `dayQuerySchema`, `planDay`, `haversineKm`
- Produces: `GET /api/course?date&start&end&with&tags&exclude` → `DayPlan` · `GET /api/spots?tag&zone&kind` → `{ items: SpotSummary[], total }` · `GET /api/spots/:id` → `{ spot: Spot, nearby: SpotSummary[] }` (nearby = `kind=spot` 장소 중 자신 제외, 거리↑ → id↑, 최대 3 — 식당 · 카페 상세에서도 주변 관광지를 보여 주기 위함) · `SpotSummary.image` = `images[0]`

- [ ] **Step 1: 실패하는 테스트**: `/api/course` 정상 쿼리 200 + `conditions.weekday === 'sat'`(date 2026-11-07) · `hours=4` 같은 v1 쿼리 → 400 '방문 날짜가 올바르지 않아요.' · `date=2026-02-30` → 400 '방문 날짜가 올바르지 않아요.' · `/api/spots?kind=cafe`는 cafe만 · `kind=bar` → 400 · nearby 거리순 · `Cache-Control: public, max-age=300` 유지.
- [ ] **Step 2:** FAIL 확인 → **Step 3:** 구현 → **Step 4:** `npm test -w apps/api` · typecheck · lint PASS, `npm run build -w apps/api` 후 실제 `spots.json`으로 `/api/course?date=2026-11-07&start=10:00&end=19:00&with=family&tags=nature,experience` 200
- [ ] **Step 5:** PR → `feat/day-course-v2`

### Task 7: 웹 — 쿼리 · 홈 입력 (프롬프트 14)

**Files:** Modify: `apps/web/src/lib/query.ts`, `lib/format.ts`, `pages/HomePage.tsx`, `hooks/useCourse.ts` · Create: `apps/web/src/lib/date.ts` · Test: `lib/query.test.ts`, `lib/date.test.ts`, `pages/HomePage.test.tsx`

**Interfaces:**
- Produces: `todayInSeoul(now: Date): string` ("YYYY-MM-DD", UTC+9 기준) · `formatDateLabel(date: string): string` ('2026-11-07' → '11월 7일(토)') · `defaultDayQuery(today: string): DayQuery` (`{ date: today, start: '10:00', end: '19:00', with: 'family', tags: ['nature','experience'], exclude: [] }`) · `fromDaySearchParams(params, today): DayQuery` · `toCourseUrl(query: DayQuery): string` (`/course?date=…&start=…&end=…&with=…&tags=…` 순서 고정, exclude 있으면 끝에) · `useCourse`는 `DayPlan` 반환

- [ ] **Step 1: 실패하는 테스트**: `todayInSeoul(new Date('2026-10-31T16:30:00Z'))` → '2026-11-01' · `formatDateLabel('2026-11-07')` → '11월 7일(토)' · `toCourseUrl` 정확한 문자열 · 홈: STEP 01이 "방문 날짜 · 시작 · 끝 시각" fieldset, 날짜 input `min`=오늘, 시작 08:00~14:00 30분 단위 select, 끝 select는 시작+3h~21:00만, 시작을 바꿔 끝이 범위를 벗어나면 끝을 시작+3h로 맞춤, 공유 URL 미리보기 갱신, 관심사 0개면 버튼 비활성(기존 문구).
- [ ] **Step 2–4:** FAIL → 구현 → `npm test -w apps/web` (Home · query · date) PASS. 홈 장소 카드는 `/api/spots?kind=spot` 앞 6개.
- [ ] **Step 5:** PR → `feat/day-course-v2`

### Task 8: 웹 — 결과 타임라인 (프롬프트 15)

**Files:** Modify: `pages/CoursePage.tsx`, `components/course/CourseTimeline.tsx`, `CourseSummary.tsx`, `ExcludedSpots.tsx`, `components/ui/icons.tsx` · Test: `pages/CoursePage.test.tsx`

**Interfaces:** Consumes: `DayPlan`, `formatDateLabel`, `toClock`, `toCourseUrl`

- [ ] **Step 1: 실패하는 테스트** (DayPlan 픽스처를 테스트에 정의): 제목 '11월 7일(토) 가족과 함께하는 청도 하루' · 항목마다 '10:00–10:40' 형식 · 종류 배지 '관광' · '점심' · '쉬어 가기' · '저녁' · 이동 행 '차로 약 12분 · 6.3km' · `waitMinutes` 15 → '여유 15분' · 요약에 '10:00–19:00', '관광 4곳' · notices 문장 표시 · excluded `CLOSED_ON_DAY` → '이날 휴무' / `NOT_ENOUGH_TIME` → '시간 부족' · 사진 있는 항목은 `<img alt>` + 출처 문구, 없으면 이미지 요소 없음 · 빈 결과(items 0)에서 '끝 시각 늦추기'(end를 21:00으로 한 URL) · '관심사 더 고르기' 버튼.
- [ ] **Step 2–4:** FAIL → 구현 → PASS. 390px에서 가로 스크롤 없음(브라우저 확인은 Claude 리뷰에서).
- [ ] **Step 5:** PR → `feat/day-course-v2`

### Task 9: 웹 — 상세 · 푸터 · 상태 화면 (프롬프트 16)

**Files:** Modify: `pages/SpotPage.tsx`, `hooks/useSpot.ts`, `components/layout/SiteFooter.tsx`, `pages/CoursePage.tsx`(400 문구) · Test: `pages/SpotPage.test.tsx`, `components/layout/SiteFooter.test.tsx`(새로)

- [ ] **Step 1: 실패하는 테스트**: 사진 있으면 대표 영역에 `<img>` + 출처('ⓒ한국관광공사'), 없으면 기존 일러스트 · 운영시간이 `formatWeeklyHours` 줄들로 표시 · `hours.note` 표시 · 출처 '출처: {source} · {checkedAt} 기준. 방문 전 확인하세요.' · "지도에서 보기" href = `https://map.kakao.com/link/map/{encodeURIComponent(name)},{lat},{lng}` + `target=_blank rel="noopener noreferrer"` · kind restaurant · cafe도 렌더 · "이 코스에서" 카드가 DayPlan의 앞뒤 항목 사용 · 푸터에 '데이터 제공: ⓒ한국관광공사' · 400 화면 허용 값 안내가 새 입력(날짜 · 시각) 기준.
- [ ] **Step 2–4:** FAIL → 구현 → `npm test -w apps/web` 전체 PASS, `npm run typecheck` · `npm run lint` 루트 전체 PASS (이 Task에서 전 워크스페이스 녹색)
- [ ] **Step 5:** PR → `feat/day-course-v2`

### Task 10 (D): 실제 데이터 일정 검토 · 문서 갱신

- [ ] **Step 1:** 실제 `spots.json`으로 설계 8장 대표 조건 3개 일정을 뽑아 사람 눈으로 검토 (휴무지 없음, 점심 창, 쓸데없는 장거리 왕복 없음). 문제는 설계 10장 조정 규칙대로 고치고 `review-log.md`에 기록.
- [ ] **Step 2:** 문서 갱신 — `mvp-spec.md`(v2 기능 · 가정), `data-model.md`, `recommendation-algorithm.md`(→ 일정 계산), `api-spec.md`, `ui-screens.md`, `user-flow.md`, ADR 0005(좌표 기반 이동 · 구조화 운영시간 · TourAPI 조사 도구 원칙), README 진행 상황.
- [ ] **Step 3:** PR → `feat/day-course-v2`

### Task 11: 통합 확인 · `main` 머지

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test && npx prettier --check .` 전체 PASS
- [ ] **Step 2:** `npm run docker:up` → 두 컨테이너 healthy, `http://localhost:8080/course?date=…` 새로고침 정상, 이미지 크기 기존 목표 안
- [ ] **Step 3:** 브라우저 확인: 데스크톱 · 390px, 키보드만으로 홈 → 결과 → 상세, 포커스 표시
- [ ] **Step 4:** `feat/day-course-v2` → `main` PR, 소유자에게 결과 요약 후 머지
