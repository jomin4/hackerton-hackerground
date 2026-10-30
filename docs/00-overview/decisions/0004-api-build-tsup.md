# ADR 0004 — API 운영 빌드: tsc 대신 tsup 번들

- 상태: 채택 (2026-10-30)
- 대체한 결정: [ADR 0002](0002-monorepo.md)의 "API 운영 빌드는 tsc가 함께 컴파일한다" 부분

## 맥락

ADR 0002대로 `packages/shared`는 빌드 없이 TS 소스를 가리킨다(`"main": "src/index.ts"`). 개발 모드(tsx)와 web(Vite)은 TS를 바로 읽으니 문제가 없지만, api를 `tsc`로 빌드해 `node dist/index.js`로 실행하면 세 가지가 깨진다.

1. 런타임에 `import '@cheongdo/shared'`가 `.ts` 파일로 연결된다 → Node가 실행하지 못한다.
2. `moduleResolution: Bundler`에서 `tsc`는 확장자 없는 상대 import(`./routes/spots`)를 그대로 내보낸다 → Node ESM이 파일을 찾지 못한다.
3. shared 소스가 api의 `rootDir` 밖에 있어 `dist/` 구조가 `dist/apps/api/src/...`로 틀어지거나 TS6059 오류가 난다.

개발 모드에서는 드러나지 않고 프롬프트 09(Docker)에서야 처음 터지는 문제라, 구현 전에 정한다.

## 결정

- api 운영 빌드는 **tsup**(esbuild 기반 번들러)으로 `src/index.ts` 하나를 `dist/index.js`로 묶는다.
- `@cheongdo/shared`는 번들 안에 포함한다(`noExternal: ['@cheongdo/shared']`). 나머지 `dependencies`(express, pino, pino-http, zod)는 번들 밖에 두고 런타임 이미지에 `npm ci --omit=dev`로 설치한다.
- 타입 검사는 빌드와 분리해 `tsc --noEmit`(`npm run typecheck`)으로 한다. tsup은 타입 검사를 하지 않는다.
- shared 패키지 구조(`"main": "src/index.ts"`)와 `moduleResolution: Bundler`는 그대로 둔다.

```ts
// apps/api/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@cheongdo/shared'],
});
```

## 근거

- 결과물이 파일 하나(`dist/index.js`)라 Dockerfile의 `CMD`가 확정된다.
- shared를 따로 빌드하지 않아도 되므로 ADR 0002의 "빌드 없는 shared" 장점이 유지된다.
- import 경로에 `.js` 확장자를 붙이는 규칙(NodeNext)을 Copilot이 놓치는 일이 없다.

## 대가

- devDependency가 하나(tsup) 늘어난다.
- 번들 결과라 오류 스택이 원본 파일과 다르다 → `sourcemap: true`, 실행 시 `node --enable-source-maps`.
- pino transport(worker thread)는 번들과 함께 쓰기 까다롭다 → 운영은 transport 없이 JSON 출력만 쓴다(`pino-pretty`는 개발 모드 전용).

## 검토한 대안

| 대안 | 기각 이유 |
|---|---|
| shared를 `tsc`로 빌드(`exports` → `dist/`) + api를 `NodeNext` | 빌드 순서 관리가 생기고, 모든 상대 import에 `.js`를 붙여야 해 Copilot 실수가 잦음 |
| 운영에서도 tsx로 실행 | 런타임 이미지에 devDependency · TS 소스가 들어가 이미지 원칙(프롬프트 09 제약)과 어긋남 |
| Node 22 type stripping으로 TS 직접 실행 | 확장자 없는 import를 지원하지 않고, 실험적 기능 의존 |
