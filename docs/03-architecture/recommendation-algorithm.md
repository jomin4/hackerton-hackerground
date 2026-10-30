# 코스 추천 알고리즘

> 구현 위치: `apps/api/src/domain/recommend-course.ts` — **순수 함수**(입출력만, I/O 없음)
> 나중에 LLM 추천으로 바꿀 때 이 함수 하나만 교체한다.

```ts
function recommendCourse(spots: Spot[], query: CourseQuery): Course
```

## 원칙

1. **결정적**: 같은 입력이면 항상 같은 출력 (URL 공유 보장). 난수 · 현재 시각 사용 금지.
2. **예산 초과 금지**: `totalMinutes ≤ hours × 60`.
3. **설명 가능**: 각 장소가 왜 들어갔는지(`matchedTags`, `companionMatch`) 응답에 남긴다.

## 단계

### 1) 후보 · 점수

- `query.exclude`에 있는 장소는 제외.
- 점수 = (`spot.tags` ∩ `query.tags` 개수 × **10**) + (`spot.goodFor`에 `query.with` 포함 시 **5**)
- **관심사가 하나도 겹치지 않으면 후보에서 제외** (동행만 맞는 장소는 넣지 않음).

### 2) 정렬 (순위)

1. 점수 내림차순
2. 동점이면 `stayMinutes` 오름차순 (짧은 곳을 먼저 → 더 많이 담기)
3. 그래도 같으면 `id` 오름차순

### 3) 1차 선택 — 보수적 이동 시간

- 예산 `B = hours × 60`, 누적 `used = 0`.
- 순위대로 보면서: 첫 장소는 이동 0, 이후는 **이동 25분(다른 권역 가정)** 을 더해 계산.
- `used + travel + stay ≤ B` 이면 담고, 아니면 건너뛰고 다음 후보를 본다(멈추지 않음).

넉넉하게 잡은 이동 시간이라 이후 실제 이동 시간으로 다시 계산해도 예산을 넘지 않는다.

### 4) 동선 정리

- **권역 순서**: 선택된 장소들 중 순위가 가장 높은 장소의 권역부터 (권역이 처음 등장한 순위 순).
- **권역 안 순서**: `routeOrder` 오름차순, 같으면 `id`.
- 실제 이동 시간 재계산: 직전 장소와 같은 권역 10분, 다른 권역 25분.

### 5) 재채움

- 남은 시간 = `B − 실제 합계`.
- 선택되지 않은 후보를 **순위 순서대로** 보면서, 4)의 규칙으로 그 장소를 넣어 동선을 다시 짰을 때 예산 안이면 추가한다.
- 추가할 때마다 동선을 다시 정리한다. 더 넣을 수 없을 때까지 반복(후보 목록을 한 번 훑으면 종료).

### 6) 결과 구성

- `stops`: 순서, 시작 · 종료 분(`startMinute` = 직전 `endMinute` + `travelMinutes`), 일치 태그(`query.tags` 순서), 동행 일치, 점수
- `excluded`: **1)의 후보**(관심사 1개 이상 일치, `exclude`로 빼지 않은 장소) 중 최종 선택되지 않은 장소 (순위 순), `reason: 'NOT_ENOUGH_TIME'`. 동행만 맞는 장소(점수 5)는 후보가 아니므로 여기에도 없다.
- `totals`: 예산, 체류 합, 이동 합, 총합, 여유(`B − 총합`)
- `zones`: 방문 순서대로 권역(중복 제거)
- 선택된 장소가 0개면(후보가 없거나 모두 시간이 부족) `stops: []`, `zones: []`이고 `totals`는 `budgetMinutes = B`, `stayMinutes = travelMinutes = totalMinutes = 0`, `slackMinutes = B` (공식 그대로). `excluded`는 위 규칙대로 채운다 (빈 결과 화면).

## 예시 계산

조건: `hours=4`(B=240), `with=family`, `tags=[nature, experience]` · 데이터: [`data-model.md`](data-model.md#초기-6곳-계산용-값)

**1) 점수**

| 장소 | 일치 태그 | 가족 | 점수 |
|---|---|---|---|
| rail-bike | nature, experience | ○ | 25 |
| yudeung-yeonji | nature | ○ | 15 |
| wine-tunnel | experience | ○ | 15 |
| eupseong | nature | ○ | 15 |
| unmunsa | nature | ○ | 15 |
| provence | experience | ○ | 15 |

**2) 순위**: rail-bike(25) → yudeung-yeonji(15, 30분) → eupseong(15, 40분) → wine-tunnel(15, 40분) → unmunsa(15, 80분) → provence(15, 100분)
(eupseong · wine-tunnel은 체류가 같아 id 순)

**3) 1차 선택** (이동 25분 가정)

| 후보 | 계산 | 누적 | 결과 |
|---|---|---|---|
| rail-bike | 0 + 60 | 60 | 담음 |
| yudeung-yeonji | 25 + 30 | 115 | 담음 |
| eupseong | 25 + 40 | 180 | 담음 |
| wine-tunnel | 25 + 40 | 245 > 240 | 건너뜀 |
| unmunsa | 25 + 80 | 285 | 건너뜀 |
| provence | 25 + 100 | 305 | 건너뜀 |

**4) 동선**: 청도읍(rail-bike) → 화양읍(yudeung-yeonji ① → eupseong ③)
실제: 60 + 25 + 30 + 10 + 40 = **165분**, 남은 시간 75분

**5) 재채움**

- wine-tunnel 추가 시 화양읍 안 순서: yudeung-yeonji ① → wine-tunnel ② → eupseong ③ → 60 + 25 + 30 + 10 + 40 + 10 + 40 = **215** ≤ 240 → 추가
- unmunsa 추가 시 다른 권역 +25 +80 → 320 → 불가
- provence 추가 시 +10 +100 → 325 → 불가

**결과**

| 순서 | 장소 | 이동 | 시간 |
|---|---|---|---|
| 1 | 청도 레일바이크 | 0 | 0:00 – 1:00 |
| 2 | 유등연지 | 25 | 1:25 – 1:55 |
| 3 | 청도 와인터널 | 10 | 2:05 – 2:45 |
| 4 | 청도읍성 | 10 | 2:55 – 3:35 |

체류 170 · 이동 45 · 총 215 · 여유 25 · 빠진 장소: 운문사, 프로방스 → 디자인 캔버스 예시와 일치.

## 테스트 케이스 (필수)

| # | 입력 | 기대 |
|---|---|---|
| T1 | 위 예시 | 순서 · 시각 · totals · excluded가 위 표와 정확히 일치 |
| T2 | 같은 입력 2회 | 결과 deep equal |
| T3 | 모든 조합 (3 × 4 × 태그 부분집합 31) | 항상 `totalMinutes ≤ budgetMinutes` |
| T4 | `hours=2`, `with=couple`, `tags=[food]` | 와인터널만 (40분) — food 태그는 와인터널뿐 |
| T5 | 관심사가 아무 장소와도 안 겹치는 데이터 (`hours=4`) | `stops: []`, `excluded: []`, `zones: []`, totals = `{ budget 240, stay 0, travel 0, total 0, slack 240 }` |
| T6 | `exclude=[rail-bike]` | rail-bike가 stops · excluded 모두에 없음 |
| T7 | 체류가 예산보다 긴 장소만 있는 데이터 | `stops: []`, 그 장소는 excluded, totals는 T5와 같은 형태 (`slack = budget`) |
| T8 | 관심사 불일치 · 동행만 일치 장소 | 후보에서 제외됨 (excluded에도 없음) |
| T9 | 재채움이 **순위가 더 높은 다른 권역** 장소를 나중에 추가하는 데이터 (아래) | 권역 순서가 추가된 순서가 아니라 **순위 순** |

**T9 데이터** — `hours=4`, `with=family`, `tags=[nature, history]`, 모든 장소 `goodFor=[solo]`

| id | zone | routeOrder | tags | stay |
|---|---|---|---|---|
| a · b · c · d | cheongdo-eup | 1 · 2 · 3 · 4 | nature, history | 20 |
| e | hwayang-eup | 1 | nature, history | 70 |
| f | unmun-myeon | 1 | nature | 10 |

순위 a → b → c → d → e → f. 1차 선택: a~d(155) → e는 155+25+70=250이라 건너뜀 → f 담음(190). 동선 실제 145분 → 재채움에서 e 추가(240). 기대: 순서 `a, b, c, d, e, f`, `zones = [cheongdo-eup, hwayang-eup, unmun-myeon]`, 총 240분. 선택된 장소를 **추가된 순서**로 권역을 정하면 `… d, f, e`가 되어 틀린다.

## 알려진 한계

- 권역 단위 이동 시간이라 실제 거리와 다를 수 있다 (특히 운문면).
- 최적해(가장 많이 담기)를 보장하지 않는 탐욕(greedy) 방식이다. MVP 규모에서는 결과 품질 · 설명 가능성이 충분하다.
- 운영시간 · 휴무를 고려하지 않는다.
