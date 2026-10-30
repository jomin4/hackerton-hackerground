# 테스트 전략

## 원칙

- **가장 중요한 것부터**: 추천 알고리즘(결정성 · 예산 준수)이 깨지면 서비스가 틀린 답을 준다 → 가장 촘촘하게.
- 테스트는 CI에서 매 push마다 돈다. 실패하면 배포되지 않는다.
- 외부 의존(파일, 네트워크)은 테스트에서 주입으로 바꾼다.

## 층별 범위

| 층 | 도구 | 대상 | 위치 |
|---|---|---|---|
| 단위 | Vitest | `recommendCourse`, `splitCsv`, 시간 포맷, URL ↔ 조건 변환 | `apps/api/test/domain/`, `apps/web/src/lib/*.test.ts` |
| 스키마 | Vitest | `spots.json`이 `spotsFileSchema`를 통과하는지 | `apps/api/test/data/` |
| API | Vitest + Supertest | 엔드포인트별 상태 코드 · 응답 형식 | `apps/api/test/routes/` |
| 화면 (선택) | Vitest + Testing Library | 조건 선택 → 요약 · 버튼 상태, 상태 화면 분기 | `apps/web/src/**/*.test.tsx` |
| 수동 | 브라우저 | 운영 리허설(`compose.local.yml`)과 배포 후 점검 | [`../06-deploy/checklist.md`](../06-deploy/checklist.md) |

## 필수 테스트 목록

### 추천 알고리즘

[`recommendation-algorithm.md` 테스트 케이스](../03-architecture/recommendation-algorithm.md#테스트-케이스-필수) T1~T9. 특히 T1(디자인 예시 재현)과 T3(전 조합 예산 준수).

### API

| 요청 | 기대 |
|---|---|
| `GET /api/health` | 200, `status: "ok"`, `spots` > 0 |
| `GET /api/spots` | 200, `total` = 데이터 수 |
| `GET /api/spots?tag=food` | 200, 모든 항목이 food 포함 |
| `GET /api/spots?tag=unknown` | 400 `INVALID_QUERY` |
| `GET /api/spots/wine-tunnel` | 200, `nearby`가 같은 권역 · 자기 자신 제외 |
| `GET /api/spots/nope` | 404 `SPOT_NOT_FOUND` |
| `GET /api/course?hours=4&with=family&tags=nature,experience` | 200, T1과 같은 결과 |
| `GET /api/course?hours=99&with=family&tags=nature` | 400, `details[0].field = "hours"` |
| `GET /api/course?hours=4&with=family&tags=` | 400 (관심사 없음) |
| `GET /api/course?hours=4&with=alien&tags=nature` | 400 |
| `GET /api/nope` | 404 `NOT_FOUND` |

## 테스트 가능한 구조

```ts
// app.ts — 저장소를 주입받는다
export function createApp(deps: { spots: SpotRepository; version: string }) { ... }

// 테스트
const app = createApp({ spots: createInMemoryRepository(fixtureSpots), version: 'test' });
await request(app).get('/api/course?...').expect(200);
```

- 알고리즘 테스트 픽스처는 [`data-model.md` 초기 6곳 표](../03-architecture/data-model.md#초기-6곳-계산용-값)를 그대로 쓴다 (`apps/api/test/fixtures/spots.ts`). 실제 `spots.json`이 바뀌어도 알고리즘 테스트는 흔들리지 않게.

## 명령

```powershell
npm test                      # 전체
npm test -w apps/api          # API만
npm test -w apps/api -- --watch   # 작성 중 감시 모드 (vitest의 -w는 --watch라 워크스페이스 지정에 쓰지 않는다)
npm run test:coverage         # 커버리지 (domain/ 90% 이상 목표, @vitest/coverage-v8)
```
