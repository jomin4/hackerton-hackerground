# 로컬 개발 환경

> 대상 OS: Windows 11 (PowerShell 기준). macOS/Linux도 명령은 같다.

## 1. 설치

| 도구 | 버전 | 확인 명령 | 비고 |
|---|---|---|---|
| Node.js | 22 LTS | `node -v` → `v22.x` | nvm-windows 또는 공식 설치 파일 |
| Git | 최신 | `git --version` | |
| VS Code | 최신 | — | |
| GitHub Copilot · Copilot Chat 확장 | 최신 | VS Code 확장 탭 | GitHub 계정 로그인 |
| Docker Desktop | 최신 | `docker version`, `docker compose version` | WSL 2 백엔드 사용. 운영 리허설용 |
| Azure CLI | 최신 | `az version` | 배포 단계에서 사용 |

추천 VS Code 확장: ESLint, Prettier, Tailwind CSS IntelliSense, Docker, (선택) Azure Virtual Machines

## 2. 저장소 받기

```powershell
git clone https://github.com/<계정>/cheongdo-course.git
cd cheongdo-course
npm install          # 워크스페이스 전체 의존성 설치
```

## 3. 개발 모드

```powershell
npm run dev
```

| 주소 | 내용 |
|---|---|
| http://localhost:5173 | 화면 (Vite) — 여기로 접속 |
| http://localhost:3000/api/health | API 직접 확인 |

- 루트 `dev` 스크립트는 web과 api를 동시에 띄운다(`concurrently` 또는 npm `--workspaces`).
- Vite가 `/api/*`를 `http://localhost:3000`으로 프록시한다 (`apps/web/vite.config.ts`).

개별 실행:

```powershell
npm run dev -w apps/api     # tsx watch src/index.ts
npm run dev -w apps/web     # vite
```

## 4. 품질 확인

```powershell
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (모든 워크스페이스)
npm test            # Vitest (api 단위 · API 테스트, web 컴포넌트 테스트)
npm run build       # web: vite build / api: tsup (shared 포함 번들 → dist/index.js)
```

PR 전에 네 개 모두 통과해야 한다 (CI와 같은 명령).

## 5. 운영 리허설 (Docker)

```powershell
docker compose -f infra/compose.local.yml up --build
```

| 주소 | 내용 |
|---|---|
| http://localhost:8080 | nginx (운영과 같은 설정, HTTPS 없음) |
| http://localhost:8080/api/health | nginx → api 프록시 확인 |

확인할 것:

- [ ] `/course?...` 주소에서 새로고침해도 화면이 뜬다 (SPA fallback)
- [ ] 개발자 도구 Network 탭에서 `/assets/*.js` 응답에 `Cache-Control: max-age=31536000, immutable`
- [ ] 응답 헤더에 `Content-Encoding: gzip`
- [ ] api 컨테이너 포트(3000)는 호스트에서 직접 접속되지 않는다

종료: `Ctrl+C` 후 `docker compose -f infra/compose.local.yml down`

## 6. 자주 막히는 곳

| 증상 | 원인 · 해결 |
|---|---|
| `EADDRINUSE :3000` | 이전 프로세스가 남음 → `netstat -ano | findstr :3000` 후 `taskkill /PID <pid> /F` |
| 화면에서 `/api` 404 | Vite 프록시 설정 누락 또는 API 미실행 |
| `Cannot find module '@cheongdo/shared'` | 루트에서 `npm install`을 안 함 (워크스페이스 링크 필요) |
| Docker 빌드에서 shared 못 찾음 | Dockerfile이 `packages/shared`를 복사하는지 확인 (빌드 컨텍스트는 저장소 루트) |
| Windows에서 줄바꿈 경고 | `.gitattributes`의 `* text=auto eol=lf` 확인 |
