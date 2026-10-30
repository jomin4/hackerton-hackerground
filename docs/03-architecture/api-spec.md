# API 명세

- Base path: `/api`
- 형식: JSON (UTF-8), 인증 없음, 읽기 전용(GET)
- 타입 정의: [`data-model.md`](data-model.md) · 구현 위치: `apps/api/src/routes/`

## 엔드포인트 요약

| 메서드 | 경로 | 설명 | 성공 | 실패 |
|---|---|---|---|---|
| GET | `/api/health` | 상태 확인 (배포 검증용) | 200 | — |
| GET | `/api/spots` | 관광지 목록 | 200 | 400 |
| GET | `/api/spots/:id` | 관광지 1곳 | 200 | 404 |
| GET | `/api/course` | 추천 코스 계산 | 200 | 400 |

## 공통 오류 형식

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "여행 시간은 2, 4, 6 중 하나여야 해요.",
    "details": [{ "field": "hours", "value": "99", "issue": "allowed: 2, 4, 6" }]
  }
}
```

| HTTP | code | 언제 |
|---|---|---|
| 400 | `INVALID_QUERY` | 쿼리 검증 실패 (zod) |
| 404 | `SPOT_NOT_FOUND` | 없는 관광지 id |
| 404 | `NOT_FOUND` | 없는 API 경로 |
| 500 | `INTERNAL_ERROR` | 예상하지 못한 오류 (메시지에 내부 정보 노출 금지) |

`message`는 화면에 그대로 보여줄 수 있는 한국어 문장으로 쓴다.

---

## GET `/api/health`

```json
{ "status": "ok", "version": "a1b2c3d", "uptimeSeconds": 1234, "spots": 6 }
```

- `version`: 환경 변수 `APP_VERSION`(CI에서 git SHA 주입), 없으면 `"dev"`
- `spots`: 로드된 관광지 수 (데이터 로드 확인용)

## GET `/api/spots`

| 쿼리 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `tag` | `Tag` | 아니오 | 이 태그를 가진 장소만 |
| `zone` | `Zone` | 아니오 | 이 권역만 |

응답 `200`:

```json
{ "items": [ /* SpotSummary[] */ ], "total": 6 }
```

`SpotSummary` = `Spot`에서 `id, name, summary, zone, tags, stayMinutes` 만.

## GET `/api/spots/:id`

응답 `200`:

```json
{
  "spot": { /* Spot 전체 */ },
  "nearby": [ /* 같은 권역 다른 장소 SpotSummary[], routeOrder 순, 최대 3개 */ ]
}
```

응답 `404`: `SPOT_NOT_FOUND`

## GET `/api/course`

### 쿼리

| 쿼리 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `hours` | `2 \| 4 \| 6` | 예 | 숫자 문자열 |
| `with` | `solo \| couple \| family \| friends` | 예 | |
| `tags` | 쉼표 구분 `Tag` | 예 | 1개 이상, 중복 제거, 알 수 없는 값은 400 |
| `exclude` | 쉼표 구분 spot id | 아니오 (P1) | 후보에서 제외 |

### 응답 `200`

```json
{
  "conditions": { "hours": 4, "with": "family", "tags": ["nature", "experience"], "exclude": [] },
  "stops": [
    {
      "order": 1,
      "spot": { "id": "rail-bike", "name": "청도 레일바이크", "summary": "...", "zone": "cheongdo-eup", "tags": ["experience", "nature"], "stayMinutes": 60 },
      "travelMinutes": 0,
      "startMinute": 0,
      "endMinute": 60,
      "matchedTags": ["nature", "experience"],
      "companionMatch": true,
      "score": 25
    }
  ],
  "excluded": [
    { "spot": { "id": "unmunsa", "...": "..." }, "reason": "NOT_ENOUGH_TIME" }
  ],
  "totals": {
    "budgetMinutes": 240,
    "stayMinutes": 170,
    "travelMinutes": 45,
    "totalMinutes": 215,
    "slackMinutes": 25
  },
  "zones": ["cheongdo-eup", "hwayang-eup"]
}
```

- `travelMinutes`: 직전 장소에서 오는 이동 시간 (첫 장소는 0)
- `startMinute` / `endMinute`: 코스 시작부터 경과 분. 화면에서 `0:00 – 1:00`으로 표시
- `excluded`: 관심사가 1개 이상 맞지만 시간 때문에 빠진 장소 (순위 순). 동행만 맞는 장소와 `exclude` 쿼리로 뺀 장소는 포함하지 않음
- 담을 수 있는 장소가 없으면 `stops: []`, `zones: []` — **400이 아니라 200** (빈 결과 화면). `totals`는 `budgetMinutes`만 예산(`hours × 60`), `slackMinutes`도 같은 값, 나머지는 0. 관심사는 맞는데 시간이 부족한 장소는 `excluded`에 남는다

### 응답 `400` 예

`GET /api/course?hours=99&with=family&tags=nature`

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "여행 시간은 2, 4, 6 중 하나여야 해요.",
    "details": [{ "field": "hours", "value": "99", "issue": "allowed: 2, 4, 6" }]
  }
}
```

## 캐시

- 응답은 데이터가 바뀌지 않는 한 결정적이다. `Cache-Control: public, max-age=300` (5분).
- `/api/health`는 `no-store`.

## 로깅

- 요청마다 pino-http로 메서드, 경로, 상태, 소요 시간을 JSON 한 줄로 남긴다.
- 4xx는 `info`, 5xx는 `error` + 스택(서버 로그에만).
