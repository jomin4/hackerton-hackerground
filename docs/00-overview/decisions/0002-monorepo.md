# ADR 0002 — 저장소 구조: npm workspaces 모노레포

- 상태: 채택 (2026-10-30) · API 운영 빌드 방식은 [ADR 0004](0004-api-build-tsup.md)로 대체됨

## 맥락

프론트엔드(React)와 백엔드(Express)가 같은 타입(`Spot`, `Course`)과 상수(관심사 태그, 동행 유형)를 공유한다. 저장소를 나누면 타입이 어긋나기 쉽고, Copilot에게 맥락을 주기도 어렵다.

## 결정

하나의 저장소에 npm workspaces로 패키지를 나눈다.

```
cheongdo-course/
├── apps/web          # React + Vite
├── apps/api          # Express + TypeScript
├── packages/shared   # 공유 타입 · 상수 · zod 스키마
├── infra/            # nginx · compose · 서버 스크립트
├── docs/
└── .github/
```

- `packages/shared`는 빌드 없이 TypeScript 소스를 그대로 참조한다(`"main": "src/index.ts"`). Vite와 tsx는 TS를 바로 읽고, API 운영 빌드는 tsup이 shared까지 한 파일로 번들한다 ([ADR 0004](0004-api-build-tsup.md)).
- 루트 `package.json`에 공통 스크립트(`dev`, `build`, `test`, `lint`)를 둔다.

## 근거

- 타입 하나를 고치면 프론트 · 백엔드에서 동시에 타입 오류로 드러난다.
- Copilot이 저장소 전체를 맥락으로 볼 수 있어 일관된 코드를 만든다.
- PR 하나에 화면 · API · 문서 변경을 함께 담을 수 있다.

## 대가

- 루트 설정(tsconfig, ESLint)을 처음에 잘 잡아야 한다 → 프롬프트 01에서 처리.
- Docker 빌드 시 워크스페이스 의존성을 함께 복사해야 한다 → 프롬프트 09에서 처리.

## 검토한 대안

- **저장소 2개 (web / api)**: 타입 공유가 어렵고 해커톤 당일 관리 부담이 큼.
- **pnpm · Turborepo**: 장점은 있지만 도구가 하나 더 늘어남. npm workspaces로 충분.
