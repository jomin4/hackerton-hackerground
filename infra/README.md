# infra

배포 관련 설정. **직접 작업 영역**이다 (Copilot은 프롬프트 09에서만 일부 작성).

| 경로 | 만드는 곳 | 내용 |
|---|---|---|
| `nginx/default.conf` | 프롬프트 09 | 이미지 기본 nginx 설정 (HTTP) |
| `compose.local.yml` | 프롬프트 09 | 로컬 운영 리허설 (빌드 포함) |
| `compose.yml` | 런북 04 · 05 | 운영 compose (GHCR 이미지, 인증서 마운트) |
| `.env.example` | 런북 04 | 운영 환경 변수 예시 (실제 `.env`는 커밋 금지) |
| `nginx/prod-http.conf` | 런북 05 | 인증서 발급 전 설정 |
| `nginx/prod-https.conf` | 런북 05 | HTTPS 최종 설정 |
| `scripts/server-setup.sh` | 런북 03 | VM 초기 설정 스크립트 |

가이드: [`../docs/06-deploy/README.md`](../docs/06-deploy/README.md)
