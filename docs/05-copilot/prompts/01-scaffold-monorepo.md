# 01 — 모노레포 뼈대

- **목적**: npm workspaces 구조와 공통 설정(TypeScript, ESLint, Prettier, Vitest), 공유 패키지를 만든다.
- **선행 조건**: Node.js 22, 빈 저장소에 `docs/`와 `.github/copilot-instructions.md`만 있는 상태
- **학습 포인트**: 워크스페이스 의존성 연결, tsconfig 상속, 루트 스크립트

## 프롬프트

```text
청도 코스 메이커 저장소의 모노레포 뼈대를 만들어줘. 아직 기능 코드는 만들지 마.

참고 문서:
#file:docs/00-overview/decisions/0002-monorepo.md
#file:docs/03-architecture/data-model.md
#file:docs/04-dev/conventions.md

만들 것:
1. 루트
   - package.json: "private": true, "workspaces": ["apps/*", "packages/*"], "engines": { "node": ">=22" }
     스크립트: dev(api와 web 동시 실행, concurrently 사용), build, test, test:coverage, lint, typecheck, format
     각 스크립트는 npm --workspaces --if-present 로 하위 패키지 스크립트를 호출
     루트 devDependencies: concurrently, @vitest/coverage-v8 (커버리지용, 프롬프트 03에서 사용)
   - tsconfig.base.json: strict, noUncheckedIndexedAccess, target ES2022, moduleResolution Bundler, skipLibCheck
   - eslint.config.js (flat config, typescript-eslint, react-hooks 규칙은 web에만)
   - .prettierrc (singleQuote, semi, printWidth 100), .prettierignore
   - .editorconfig 새로 만들기. .gitattributes, .gitignore 는 이미 있으니 빠진 항목만 보완
   - apps/, packages/ 안의 .gitkeep 파일은 실제 파일이 생기면 삭제
   - .nvmrc (22)
2. packages/shared
   - package.json: name "@cheongdo/shared", "type": "module", "main": "src/index.ts", "types": "src/index.ts", 의존성 zod
   - src/constants.ts: TAGS, TAG_LABELS, COMPANIONS, COMPANION_LABELS, HOURS, ZONES, ZONE_LABELS, TRAVEL_MINUTES, UNVERIFIED_SOURCE (data-model.md 그대로)
   - src/types.ts: OpeningHours, Spot, SpotSummary, CourseQuery, CourseStop, ExcludedSpot, CourseTotals, Course
   - src/schemas.ts: spotSchema, spotsFileSchema, courseQuerySchema, spotsQuerySchema(tag?, zone? 선택), splitCsv 함수
     courseQuerySchema는 tags를 TAGS 배열 순서로 정렬한 결과를 내보내야 함
   - src/index.ts: 위 세 파일 re-export
   - src/schemas.test.ts: splitCsv(공백 · 빈 값 · 중복 처리), courseQuerySchema(정상, hours=99, 빈 tags, 알 수 없는 tag, tags 정렬),
     spotSchema(운영 정보 없고 checkedAt 없음 → 통과, hours 있는데 checkedAt 없음 → 실패) 테스트
   - tsconfig.json (base 상속), vitest 설정
3. apps/api, apps/web 은 package.json과 tsconfig.json만 있는 빈 패키지로 (이름: @cheongdo/api, @cheongdo/web), 둘 다 "@cheongdo/shared": "*" 의존

제약:
- 설치하는 패키지는 최신 안정 버전으로 npm install 명령으로 설치 (버전을 손으로 적지 말 것)
- docs/ 폴더와 .github/copilot-instructions.md는 수정하지 마
- 루트 README.md는 내가 따로 관리하니 건드리지 마

완료 기준 (직접 실행해서 확인):
- npm install 성공
- npm run typecheck 통과
- npm run lint 통과
- npm test 통과 (shared 테스트)

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] `packages/shared`의 상수 · 타입이 data-model.md와 이름 · 값까지 일치
- [ ] `TAGS` 순서: nature, history, experience, food, photo
- [ ] `courseQuerySchema` 결과의 `tags`가 정렬 · 중복 제거됨
- [ ] apps 두 곳에서 `@cheongdo/shared` import 시 타입 오류 없음
- [ ] `.gitignore`에 `.env`는 무시, `.env.example`은 포함
- [ ] 불필요한 패키지(lodash 등) 추가 없음
