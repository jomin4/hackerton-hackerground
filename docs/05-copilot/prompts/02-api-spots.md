# 02 — API 골격 + 관광지 API

- **목적**: Express 앱 구조(설정, 로깅, 에러 처리, 저장소)를 세우고 `/api/health`, `/api/spots`, `/api/spots/:id`를 구현한다.
- **선행 조건**: 01 완료
- **학습 포인트**: 앱 · 서버 분리, 의존성 주입, 공통 에러 형식, 시작 시 데이터 검증

## 프롬프트

```text
apps/api 에 Express 앱 골격과 관광지 조회 API를 구현해줘. /api/course 는 아직 만들지 마.

참고 문서:
#file:docs/03-architecture/api-spec.md
#file:docs/03-architecture/data-model.md
#file:docs/03-architecture/system-overview.md
#file:docs/04-dev/conventions.md
#file:docs/04-dev/testing.md
#file:docs/00-overview/decisions/0004-api-build-tsup.md

설치: express(5), pino, pino-http, zod, (dev) tsx, tsup, typescript, @types/express, @types/node, vitest, supertest, @types/supertest
(zod는 shared 번들이 런타임에 import 하므로 api의 dependencies에도 직접 넣는다)

만들 파일 (conventions.md의 폴더 구조를 따름):
- src/config.ts: PORT(기본 3000), NODE_ENV, LOG_LEVEL(기본 info), DATA_PATH(기본 ./data/spots.json), APP_VERSION(기본 "dev")를 읽고 zod로 검증
- src/lib/logger.ts: pino. development에서는 사람이 읽기 쉬운 형식이 필요하면 pino-pretty를 dev 의존성으로 쓰고, production은 JSON
- src/lib/http-error.ts: class HttpError(status, code, message, details?)
- src/data/spot-repository.ts:
  - interface SpotRepository { findAll(): Spot[]; findById(id: string): Spot | undefined }
  - loadSpotsFromFile(path): 파일을 읽고 spotsFileSchema로 검증, 실패하면 어떤 항목이 왜 틀렸는지 담은 Error를 던짐
  - createInMemoryRepository(spots: Spot[]): SpotRepository
- src/middleware/not-found.ts: 404 NOT_FOUND
- src/middleware/error-handler.ts: HttpError → 공통 형식, ZodError → 400 INVALID_QUERY(details에 field/value/issue), 그 외 → 500 INTERNAL_ERROR(내부 메시지 노출 금지, 로그에는 스택)
- src/routes/health.ts: GET /api/health → { status, version, uptimeSeconds, spots } , Cache-Control: no-store
- src/routes/spots.ts:
  - GET /api/spots?tag=&zone= → { items: SpotSummary[], total } (spotsQuerySchema로 검증)
  - GET /api/spots/:id → { spot, nearby } nearby는 같은 zone, 자기 자신 제외, routeOrder 순, 최대 3개 / 없으면 404 SPOT_NOT_FOUND
  - Cache-Control: public, max-age=300
- src/app.ts: createApp({ spots: SpotRepository, version: string, logger }) — express.json, pino-http, 라우트, not-found, error-handler 순서. x-powered-by 비활성화
- src/index.ts: config 읽기 → loadSpotsFromFile → createApp → listen. 데이터 검증 실패 시 에러 로그 후 process.exit(1). SIGTERM 받으면 server.close 후 종료
- data/spots.json: data-model.md "초기 6곳 계산용 값" 표의 6곳. 와인터널은 data-model.md 예시 전체를 그대로 사용.
  나머지 5곳은 표의 zone/routeOrder/tags/goodFor/stayMinutes를 쓰고, name/summary/description/tips/address는 docs/01-product/spots-data.md 와 ui-screens 디자인 문구를 참고해 작성.
  description · tips 에는 연도 · 거리 · 요금 · 운영시간 · 전화번호 같은 구체적 사실을 넣지 말고, 장소 성격을 설명하는 일반적인 문장만 써 (사실 확인 전 데이터라서). summary 는 80자 이하
  운영시간·휴무·요금·전화번호와 checkedAt은 확인되지 않았으므로 생략(필드 자체를 넣지 마). source는 @cheongdo/shared 의 UNVERIFIED_SOURCE 값("확인 전 임시 정보"),
  address는 권역 단위까지만("경상북도 청도군 화양읍" 등, 번지 지어내지 마). 규칙은 docs/01-product/spots-data.md 원칙 3
- package.json 스크립트: dev(tsx watch src/index.ts), build(tsup), start(node --enable-source-maps dist/index.js), test(vitest run), test:coverage(vitest run --coverage), typecheck(tsc --noEmit)
- tsup.config.ts: docs/00-overview/decisions/0004-api-build-tsup.md 의 설정 그대로. @cheongdo/shared 는 noExternal 로 번들에 포함, 나머지 dependencies 는 외부로 둠
  결과물은 dist/index.js 한 파일 (tsc 로 빌드하지 마. tsc 는 타입 검사 전용)
- test/fixtures/spots.ts: 03에서 이미 만들었으니 그대로 재사용 (값 수정 금지, 라우트 테스트에 필요한 필드만 추가 가능)
- test/routes/health.test.ts, test/routes/spots.test.ts: testing.md의 API 표 중 health/spots 항목 전부
- test/data/spots-file.test.ts: 실제 data/spots.json이 스키마를 통과하는지

제약:
- 라우트 핸들러 안에서 try/catch 반복 금지 (Express 5 async 에러 전달 사용)
- src/domain/ 은 03에서 만든 recommend-course.ts 가 있으니 수정하지 마
- 확인되지 않은 운영 정보 지어내지 마

완료 기준:
- npm test -w apps/api 통과
- npm run typecheck, npm run lint 통과
- npm run dev -w apps/api 실행 후 http://localhost:3000/api/health 가 { status: "ok", spots: 6 ... } 응답
- npm run build -w apps/api 후 npm start -w apps/api 로도 같은 응답

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] `index.ts` 외에는 `listen` 없음, 테스트가 `createApp`으로 앱 생성
- [ ] 에러 응답 형식이 api-spec.md와 동일 (`error.code`, `message`, `details`)
- [ ] 500 응답에 스택 · 내부 메시지 노출 없음
- [ ] `spots.json`에 확인 안 된 운영시간 · 요금 · 전화번호 없음
- [ ] 와인터널 외 5곳은 `checkedAt` 없음, `source`가 `"확인 전 임시 정보"`, 주소에 번지 없음
- [ ] 와인터널 데이터가 출처 값과 일치
- [ ] `npm run build -w apps/api` 결과가 `dist/index.js` 한 파일이고, 그 안에 shared 코드가 포함됨 (`@cheongdo/shared` import가 남아 있지 않음)
- [ ] `npm start -w apps/api`로 실행 가능, `/api/health` 응답이 dev 모드와 같음
- [ ] api `dependencies`에 zod가 직접 들어 있음
- [ ] SIGTERM 처리 (Docker 종료 시 깔끔하게 내려감)
