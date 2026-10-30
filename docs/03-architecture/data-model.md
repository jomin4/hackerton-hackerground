# 데이터 모델

> 구현 위치: `packages/shared/src/` (타입 · 상수 · zod 스키마). 프론트와 API가 같은 정의를 import한다.

## 상수

```ts
export const TAGS = ['nature', 'history', 'experience', 'food', 'photo'] as const;
export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  nature: '자연',
  history: '역사·문화',
  experience: '체험',
  food: '먹거리',
  photo: '사진 명소',
};

export const COMPANIONS = ['solo', 'couple', 'family', 'friends'] as const;
export type Companion = (typeof COMPANIONS)[number];

export const COMPANION_LABELS: Record<Companion, string> = {
  solo: '혼자', couple: '커플', family: '가족', friends: '친구',
};

export const HOURS = [2, 4, 6] as const;
export type Hours = (typeof HOURS)[number];

export const ZONES = ['cheongdo-eup', 'hwayang-eup', 'unmun-myeon', 'iseo-myeon'] as const;
export type Zone = (typeof ZONES)[number];

export const ZONE_LABELS: Record<Zone, string> = {
  'cheongdo-eup': '청도읍', 'hwayang-eup': '화양읍', 'unmun-myeon': '운문면', 'iseo-myeon': '이서면',
};

export const TRAVEL_MINUTES = { sameZone: 10, otherZone: 25 } as const;

// 기본 정보(이름 · 주소 · 소개)를 아직 공식 출처로 확인하지 못한 장소의 source 값
export const UNVERIFIED_SOURCE = '확인 전 임시 정보';
```

`TAGS` 배열 순서가 **표시 순서이자 URL 정렬 순서**다.

## Spot

```ts
export interface OpeningHours {
  weekday?: string;      // "09:30-18:00"
  weekend?: string;      // "09:30-19:00"
  note?: string;         // "마감 15분 전까지 퇴장"
}

export interface Spot {
  id: string;            // kebab-case, URL에 쓰임. 예: "wine-tunnel"
  name: string;          // "청도 와인터널"
  summary: string;       // 카드용 한 줄 (60자 내외)
  description: string[]; // 상세 소개 문단들
  tips: string[];        // 방문 팁
  zone: Zone;
  routeOrder: number;    // 같은 권역 안에서의 동선 순서 (작을수록 먼저)
  tags: Tag[];           // 1개 이상
  goodFor: Companion[];  // 1개 이상
  stayMinutes: number;   // 권장 체류 (10~240)
  address: string;
  hours?: OpeningHours;
  closed?: string;       // "연중무휴", "매주 월요일"
  fee?: string;          // "관람 무료 · 시음 별도"
  phone?: string;
  source: string;        // 기본 정보 출처. "한국관광공사" / 확인 전이면 UNVERIFIED_SOURCE
  checkedAt?: string;    // "2026-08-18" — 운영 정보(hours · closed · fee · phone)를 확인한 날짜
}
```

선택 필드(`?`)는 확인하지 못했으면 **생략**한다. 빈 문자열을 넣지 않는다.

- `checkedAt`은 운영 정보를 **실제로 확인한 날짜**다. 운영 정보 필드(`hours`, `closed`, `fee`, `phone`)가 하나라도 있으면 필수, 하나도 없으면 생략한다. 데이터를 작성한 날짜를 넣지 않는다.
- `address`를 확인하지 못했으면 권역 단위까지만 쓴다 (예: `"경상북도 청도군 화양읍"`). 번지를 지어내지 않는다.

## 코스

```ts
export interface CourseQuery {
  hours: Hours;
  with: Companion;
  tags: Tag[];           // 정렬 · 중복 제거된 상태
  exclude: string[];     // P1
}

export type SpotSummary = Pick<Spot, 'id' | 'name' | 'summary' | 'zone' | 'tags' | 'stayMinutes'>;

export interface CourseStop {
  order: number;         // 1부터
  spot: SpotSummary;
  travelMinutes: number;
  startMinute: number;
  endMinute: number;
  matchedTags: Tag[];
  companionMatch: boolean;
  score: number;
}

export interface ExcludedSpot {
  spot: SpotSummary;
  reason: 'NOT_ENOUGH_TIME';
}

export interface CourseTotals {
  budgetMinutes: number;
  stayMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
  slackMinutes: number;
}

export interface Course {
  conditions: CourseQuery;
  stops: CourseStop[];
  excluded: ExcludedSpot[];
  totals: CourseTotals;
  zones: Zone[];         // 코스가 지나는 권역 (방문 순)
}
```

## zod 스키마

```ts
// 데이터 파일 검증 (서버 시작 시)
export const spotSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  summary: z.string().min(1).max(80),
  description: z.array(z.string().min(1)).min(1),
  tips: z.array(z.string().min(1)),
  zone: z.enum(ZONES),
  routeOrder: z.number().int().min(1),
  tags: z.array(z.enum(TAGS)).min(1),
  goodFor: z.array(z.enum(COMPANIONS)).min(1),
  stayMinutes: z.number().int().min(10).max(240),
  address: z.string().min(1),
  hours: z.object({ weekday: z.string().optional(), weekend: z.string().optional(), note: z.string().optional() }).optional(),
  closed: z.string().optional(),
  fee: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().min(1),
  checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (s) => s.checkedAt !== undefined || (s.hours === undefined && s.closed === undefined && s.fee === undefined && s.phone === undefined),
  { message: '운영 정보가 있으면 checkedAt(확인 날짜)이 필요합니다', path: ['checkedAt'] },
);
export const spotsFileSchema = z.array(spotSchema).refine(
  (spots) => new Set(spots.map((s) => s.id)).size === spots.length,
  { message: 'spot id가 중복되었습니다' },
);

// /api/course 쿼리 검증 — 문자열 쿼리를 CourseQuery로 변환
export const courseQuerySchema = z.object({
  hours: z.coerce.number().refine((n) => (HOURS as readonly number[]).includes(n), { message: '여행 시간은 2, 4, 6 중 하나여야 해요.' }),
  with: z.enum(COMPANIONS, { message: '동행은 solo, couple, family, friends 중 하나여야 해요.' }),
  tags: z.string().transform(splitCsv).pipe(z.array(z.enum(TAGS)).min(1, '관심사를 하나 이상 골라주세요.')),
  exclude: z.string().optional().transform((v) => (v ? splitCsv(v) : [])),
});
```

`splitCsv`: 쉼표로 나누고 공백 제거 · 빈 값 제거 · 중복 제거. `tags`는 이후 `TAGS` 순서로 정렬.

> zod 버전에 따라 `z.enum` 에러 메시지 옵션 이름이 다를 수 있다. 구현 시 설치된 버전 문서를 따른다.

## spots.json 예 (와인터널)

```json
{
  "id": "wine-tunnel",
  "name": "청도 와인터널",
  "summary": "옛 철도 터널을 와인 저장고로 바꾼 곳. 청도 반시로 만든 감와인을 시음할 수 있어요.",
  "description": [
    "대한제국 말기 경부선 철도를 놓으며 뚫었던 옛 터널을 와인 저장고로 바꾼 곳이에요. 벽돌과 돌로 쌓은 아치형 터널이 약 1km 이어지고, 안쪽은 1년 내내 서늘해 와인을 숙성하기에 알맞아요.",
    "청도 특산물인 반시로 만든 감와인을 시음하고 구매할 수 있고, 조명이 켜진 터널 내부는 사진 명소로도 알려져 있어요."
  ],
  "tips": [
    "터널 안은 연중 서늘해요. 여름에도 얇은 겉옷을 챙기면 좋아요.",
    "주말과 연휴에는 입구 주변 도로가 붐빌 수 있어요. 이른 시간 방문을 추천해요.",
    "청도 프로방스, 청도읍성과 같은 화양읍 권역이라 한 코스로 묶기 좋아요."
  ],
  "zone": "hwayang-eup",
  "routeOrder": 2,
  "tags": ["experience", "food", "photo"],
  "goodFor": ["couple", "family", "friends"],
  "stayMinutes": 40,
  "address": "경상북도 청도군 화양읍 송금길 100",
  "hours": { "weekday": "09:30-18:00", "weekend": "09:30-19:00", "note": "마감 15분 전까지 퇴장" },
  "closed": "연중무휴",
  "fee": "관람 무료 · 시음 별도",
  "phone": "054-371-1904",
  "source": "한국관광공사",
  "checkedAt": "2026-08-18"
}
```

## 초기 6곳 계산용 값

| id | zone | routeOrder | tags | goodFor | stay |
|---|---|---|---|---|---|
| `rail-bike` | cheongdo-eup | 1 | experience, nature | couple, family, friends | 60 |
| `yudeung-yeonji` | hwayang-eup | 1 | nature, photo | solo, couple, family | 30 |
| `wine-tunnel` | hwayang-eup | 2 | experience, food, photo | couple, family, friends | 40 |
| `eupseong` | hwayang-eup | 3 | history, nature, photo | solo, couple, family | 40 |
| `provence` | hwayang-eup | 4 | photo, experience | couple, family, friends | 100 |
| `unmunsa` | unmun-myeon | 1 | history, nature | solo, couple, family | 80 |

`goodFor` · `routeOrder` · `stayMinutes`는 현재 가정값이다. 바꾸면 알고리즘 테스트 기대값도 함께 갱신한다.
