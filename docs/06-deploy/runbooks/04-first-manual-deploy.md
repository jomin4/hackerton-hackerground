# 런북 04 — 첫 수동 배포 (HTTP)

## 이번에 배울 것

| 개념 | 한 줄 정의 |
|---|---|
| 컨테이너 레지스트리 | 빌드한 이미지를 올려 두고 서버가 내려받는 저장소 (여기서는 GHCR) |
| 이미지 태그 | 이미지 버전 이름. `latest`와 git SHA를 함께 쓴다 |
| 운영 compose | 빌드하지 않고 레지스트리의 이미지를 받아 실행하는 compose |

MS Learn 연결: 컴퓨팅 서비스 › 컨테이너 (VM과 컨테이너의 차이)

## 왜 하는가

자동화(런북 06) 전에 **손으로 한 번** 해 봐야 파이프라인의 각 단계가 무엇을 하는지 안다. 선행: Copilot 프롬프트 09 완료(로컬 `docker:up` 성공).

## 실행

### 1. GHCR 로그인 (내 PC)

GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → `write:packages`, `read:packages` 권한으로 토큰 생성 (만료일 설정).

```powershell
$env:CR_PAT = "<토큰>"     # 이 창에서만 유지, 파일에 저장하지 말 것
$env:CR_PAT | docker login ghcr.io -u <GitHub 계정> --password-stdin
```

### 2. 이미지 빌드 · 푸시 (내 PC, 저장소 루트)

GHCR 이미지 이름은 **소문자**여야 한다.

```powershell
$OWNER = "<github 계정 소문자>"
$SHA = git rev-parse --short HEAD

docker build -f apps/api/Dockerfile --build-arg APP_VERSION=$SHA `
  -t ghcr.io/$OWNER/cheongdo-course-api:$SHA -t ghcr.io/$OWNER/cheongdo-course-api:latest .
docker build -f apps/web/Dockerfile `
  -t ghcr.io/$OWNER/cheongdo-course-web:$SHA -t ghcr.io/$OWNER/cheongdo-course-web:latest .

docker push ghcr.io/$OWNER/cheongdo-course-api --all-tags
docker push ghcr.io/$OWNER/cheongdo-course-web --all-tags
```

> Apple Silicon Mac에서 빌드하면 VM(amd64)과 아키텍처가 다르다 → `docker buildx build --platform linux/amd64 ... --push` 사용. Windows(x64)는 해당 없음.

GitHub → 내 프로필 → **Packages**에서 두 패키지 확인. 패키지 설정에서 저장소와 연결하고, 공개 저장소라면 패키지도 **Public**으로 바꾸면 VM에서 로그인 없이 받을 수 있다. 비공개로 둔다면 VM에서도 `read:packages` 토큰으로 `docker login`이 필요하다.

### 3. 운영 compose 작성 (저장소 `infra/compose.yml`)

직접 작성한다. 로컬 리허설용(`compose.local.yml`)과의 차이를 생각하며 쓸 것.

```yaml
services:
  api:
    image: ghcr.io/${GHCR_OWNER}/cheongdo-course-api:${IMAGE_TAG:-latest}
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
    expose:
      - "3000"
    restart: unless-stopped

  web:
    image: ghcr.io/${GHCR_OWNER}/cheongdo-course-web:${IMAGE_TAG:-latest}
    ports:
      - "80:80"
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
```

`infra/.env.example`도 만든다 (실제 `.env`는 커밋 금지):

```
GHCR_OWNER=yourgithubid
IMAGE_TAG=latest
DOMAIN=cheongdo-course-xx.koreacentral.cloudapp.azure.com
```

### 4. 서버에 올리고 실행 (VM)

내 PC에서 compose 파일 복사:

```powershell
scp infra/compose.yml azureuser@<FQDN>:/opt/cheongdo-course/compose.yml
```

VM에서:

```bash
cd /opt/cheongdo-course
cat > .env <<'EOF'
GHCR_OWNER=<github 계정 소문자>
IMAGE_TAG=latest
DOMAIN=<FQDN>
EOF
chmod 600 .env

docker compose pull
docker compose up -d
docker compose ps
```

## 확인

```bash
docker compose ps                         # 두 서비스 running, api healthy
docker compose logs --tail=50 api
curl -s http://localhost/api/health
```

내 PC 브라우저에서 `http://<FQDN>` → 홈 화면, `/course?hours=4&with=family&tags=nature,experience` 새로고침 정상.

## 이해 점검

1. 로컬 리허설 compose와 운영 compose의 차이 3가지는? (build vs image, 포트, env)
2. 서버에서 이미지를 빌드하지 않고 레지스트리에서 받는 이유는?
3. `IMAGE_TAG`를 `latest` 대신 SHA로 지정하면 무엇이 좋아지나?
4. `restart: unless-stopped`는 VM이 재부팅되면 어떻게 동작하나? (직접 `sudo reboot`로 확인)

## 정리 · 비용

지금은 HTTP라 주소창에 "주의 요함"이 뜬다 → 런북 05. 실습을 멈출 땐 `az vm deallocate` (컨테이너는 재시작 시 자동으로 다시 뜬다).
