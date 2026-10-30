# 03 — 코스 추천 알고리즘

- **목적**: 서비스의 핵심인 `recommendCourse()`를 순수 함수로 구현하고, 문서의 테스트 케이스로 검증한다.
- **선행 조건**: 01 완료 (02와 독립)
- **학습 포인트**: 테스트 먼저 작성(TDD), 결정적 알고리즘, 순수 함수 분리

## 프롬프트

```text
apps/api/src/domain/recommend-course.ts 에 코스 추천 알고리즘을 구현해줘.
먼저 테스트를 작성하고 실패하는 것을 확인한 뒤 구현해.

참고 문서 (알고리즘은 이 문서가 정답이야. 임의로 규칙을 바꾸지 마):
#file:docs/03-architecture/recommendation-algorithm.md
#file:docs/03-architecture/data-model.md

먼저 할 것 (apps/api 는 01에서 package.json · tsconfig.json 만 있는 빈 패키지 상태):
- apps/api/package.json: "type": "module" 추가, 스크립트 test(vitest run), test:coverage(vitest run --coverage), typecheck(tsc --noEmit), lint(eslint src test)
  (vitest · @vitest/coverage-v8 · typescript · eslint 는 루트에 이미 있으니 새로 설치하지 마)
- apps/api/tsconfig.json: include 에 "test" 추가 (테스트 파일도 타입 검사)
- apps/api/vitest.config.ts: include test/**/*.test.ts, coverage provider v8, coverage include src/**/*.ts
- dev · build · start 스크립트와 Express 관련 설정은 02에서 하니 지금 만들지 마

함수:
export function recommendCourse(spots: Spot[], query: CourseQuery): Course
- 타입은 @cheongdo/shared 에서 import
- 순수 함수: 입력만 쓰고 I/O, Date, Math.random, 환경 변수 사용 금지
- 문서의 6단계(후보·점수 → 정렬 → 1차 선택(이동 25분 가정) → 동선 정리 → 재채움 → 결과 구성)를 각각 작은 함수로 나누고, 함수 이름에 단계가 드러나게
- 점수 가중치(10, 5), 이동 시간은 @cheongdo/shared 의 TRAVEL_MINUTES와 상수로 관리 (매직 넘버 금지)
- matchedTags 는 query.tags 순서, spot은 SpotSummary로 축소해서 담기

테스트 파일: apps/api/test/domain/recommend-course.test.ts
- 픽스처: apps/api/test/fixtures/spots.ts (02에서 만들었으면 재사용, 없으면 data-model.md "초기 6곳 계산용 값" 표로 생성)
- 문서의 테스트 케이스 T1~T9 전부 구현
  - T1은 순서(id 배열), 각 stop의 travelMinutes/startMinute/endMinute, totals 5개 값, excluded id 배열을 모두 정확히 검사
  - T3는 hours 3종 × with 4종 × tags 공집합 제외 부분집합 31개 전부 돌면서 totalMinutes <= budgetMinutes 검사
- 추가: 반환된 stops의 order가 1부터 연속인지, startMinute = 직전 endMinute + travelMinutes 인지
- 기대값은 recommendation-algorithm.md 의 표 숫자를 그대로 리터럴로 적어 (구현 함수로 기대값을 계산하지 마)

제약:
- routes, app.ts 는 수정하지 마 (04에서 연결)
- 테스트 기대값을 구현에 맞춰 바꾸지 마. 문서 기대값과 다르면 구현을 고쳐. 문서가 틀렸다고 판단되면 바꾸지 말고 이유를 보고해

완료 기준:
- npm test -w apps/api 통과 (T1~T9 포함)
- npm run typecheck, npm run lint 통과
- 커버리지 확인: npm run test:coverage -w apps/api 에서 domain/recommend-course.ts 라인 커버리지 90% 이상

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과(테스트 개수 포함), 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] T1 결과: rail-bike → yudeung-yeonji → wine-tunnel → eupseong, 총 215분, 빠진 장소 unmunsa · provence
- [ ] 1차 선택에서 예산을 넘는 후보를 만나도 **멈추지 않고** 다음 후보를 봄
- [ ] 재채움 후 동선을 다시 정리함 (권역 순서 · routeOrder)
- [ ] 관심사 0개 일치 장소는 excluded에도 없음
- [ ] 정렬 동점 처리: 점수 ↓ → 체류 ↑ → id ↑
- [ ] 함수 안에 `Date`, `Math.random`, `process.env` 없음
- [ ] 단계별 함수가 export 없이 내부 함수로 정리됨 (공개 API는 `recommendCourse` 하나)
