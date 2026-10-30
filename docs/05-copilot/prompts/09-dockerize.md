# 09 — Docker 이미지 · nginx · 로컬 리허설

- **목적**: web · api 이미지를 만들고, 운영과 같은 구조를 로컬에서 `docker compose`로 띄운다.
- **선행 조건**: 04, 08 완료
- **학습 포인트**: 멀티 스테이지 빌드, 모노레포 Docker 빌드, nginx 리버스 프록시 · 캐시 · SPA fallback
- **범위 주의**: 이 프롬프트는 **로컬 리허설용**까지만. 운영 compose · HTTPS · CI/CD는 [`../../06-deploy/`](../../06-deploy/README.md)에서 직접 작업한다.

## 프롬프트

```text
web 과 api 의 Docker 이미지와 로컬 리허설용 compose 를 만들어줘. 이번 작업에 한해 infra/ 폴더 작업을 허용해.
운영용 compose, HTTPS, GitHub Actions 는 만들지 마 (내가 직접 할 거야).

참고 문서:
#file:docs/03-architecture/system-overview.md
#file:docs/04-dev/local-setup.md
#file:docs/00-overview/decisions/0004-api-build-tsup.md

만들 것:
1. apps/api/Dockerfile (빌드 컨텍스트는 저장소 루트)
   - build 스테이지: node:22-alpine, 루트 package.json/package-lock.json 과 apps/api, packages/shared 의 package.json 먼저 복사 → npm ci --workspace @cheongdo/api --include-workspace-root → 소스 복사 → npm run build -w apps/api
   - runtime 스테이지: node:22-alpine, NODE_ENV=production, 루트 package.json/package-lock.json 과 apps/api, packages/shared 의 package.json 만 복사 → 운영 의존성만 설치(npm ci --omit=dev --workspace @cheongdo/api), build 스테이지의 apps/api/dist 와 apps/api/data/spots.json 복사, USER node, EXPOSE 3000
     shared 는 tsup 번들(dist/index.js)에 이미 들어 있으니 packages/shared 소스는 복사하지 않음 (ADR 0004)
   - HEALTHCHECK: wget -qO- http://127.0.0.1:3000/api/health || exit 1
   - WORKDIR 는 api 워크스페이스 디렉터리(예: /app/apps/api)로 두어 DATA_PATH 기본값 ./data/spots.json 이 그대로 맞게
   - CMD ["node", "--enable-source-maps", "dist/index.js"]
   - ARG APP_VERSION → ENV APP_VERSION
2. apps/web/Dockerfile (빌드 컨텍스트는 저장소 루트)
   - build 스테이지: node:22-alpine, 같은 방식으로 web 워크스페이스 설치 → npm run build -w apps/web
   - runtime 스테이지: nginx:alpine, dist → /usr/share/nginx/html, infra/nginx/default.conf → /etc/nginx/conf.d/default.conf
3. .dockerignore (루트): node_modules, **/dist, coverage, .git, .env*, docs
4. infra/nginx/default.conf (HTTP 80, 로컬·운영 공통 기본 설정)
   - root /usr/share/nginx/html
   - location /api/ → proxy_pass http://api:3000; Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto 헤더, proxy_read_timeout 10s
   - location /assets/ → expires 1y, Cache-Control "public, max-age=31536000, immutable"
   - location / → try_files $uri $uri/ /index.html; index.html 은 Cache-Control no-cache
   - gzip on (text/css, application/javascript, application/json, image/svg+xml), gzip_min_length 1024
   - 보안 헤더: X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options DENY
   - server_tokens off
   - location = /healthz → return 200 "ok"
5. infra/compose.local.yml
   - api: build(context ../, dockerfile apps/api/Dockerfile), environment NODE_ENV=production, LOG_LEVEL=info, restart unless-stopped, ports 노출하지 않음(expose 3000만)
   - web: build(context ../, dockerfile apps/web/Dockerfile), ports "8080:80", depends_on api (condition: service_healthy), restart unless-stopped
6. 루트 package.json 스크립트: "docker:up": "docker compose -f infra/compose.local.yml up --build", "docker:down": "docker compose -f infra/compose.local.yml down"

제약:
- 이미지에 소스 TS, 테스트, devDependencies, .env 가 들어가지 않게
- api 는 root 가 아닌 node 사용자로 실행
- infra/compose.yml(운영용), .github/workflows 는 만들지 마

완료 기준:
- npm run docker:up 성공, 두 컨테이너 healthy (docker compose -f infra/compose.local.yml ps)
- http://localhost:8080 홈 화면, /course?hours=4&with=family&tags=nature,experience 새로고침해도 정상
- http://localhost:8080/api/health 200
- http://localhost:3000 은 접속 안 됨 (api 비공개)
- curl -I http://localhost:8080/assets/<파일명>.js 에 immutable 캐시 헤더, gzip 응답
- docker images 로 이미지 크기 보고 (api 200MB 이하, web 60MB 이하 목표)

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과(이미지 크기 포함), 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] 빌드 컨텍스트가 루트이고 shared 패키지가 포함됨
- [ ] 의존성 설치 레이어가 소스 복사보다 먼저 (캐시 효율)
- [ ] api 런타임 이미지에 devDependencies · TS 소스 없음, `USER node`
- [ ] api 런타임 이미지에 `packages/shared` 소스가 없어도 실행됨 (shared는 번들에 포함)
- [ ] api 포트가 호스트에 열리지 않음
- [ ] SPA 새로고침 · 캐시 헤더 · gzip · 보안 헤더 확인
- [ ] `add_header`를 쓴 location(`/assets/`, `/`)에도 보안 헤더가 실제 응답에 있는지 `curl -I`로 확인 (nginx는 location에 `add_header`가 있으면 server 수준 헤더를 상속하지 않음)
- [ ] 이 nginx 설정이 운영 HTTPS 설정의 기반이 됨 → 런북 05에서 443 블록 추가
