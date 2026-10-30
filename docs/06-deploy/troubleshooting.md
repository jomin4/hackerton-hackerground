# 트러블슈팅 기록

> 직접 겪은 문제를 기록한다. 같은 문제를 두 번 찾지 않기 위한 문서이자, 해커톤 당일의 무기다.

## 기록 양식

```markdown
### [YYYY-MM-DD] 증상 한 줄

- 단계: 런북 NN / CI / 운영
- 증상: (오류 메시지 원문)
- 원인:
- 해결: (실행한 명령)
- 배운 점:
```

## 미리 알아 두면 좋은 문제들

| 증상 | 흔한 원인 | 확인 · 해결 |
|---|---|---|
| `ssh: connect ... port 22: Connection timed out` | NSG 22번 규칙의 원본 IP가 지금 내 IP와 다름 | 내 IP 재확인 후 `az network nsg rule update ... --source-address-prefixes <IP>/32` |
| `Permission denied (publickey)` | 다른 개인 키 사용 | `ssh -i ~/.ssh/id_rsa ...`, VM의 `~/.ssh/authorized_keys` 확인 |
| `permission denied while trying to connect to the Docker daemon` | docker 그룹 적용 전 | 로그아웃 후 재접속 |
| `docker compose pull` → `denied` / `unauthorized` | GHCR 패키지가 비공개 | 패키지를 Public으로 또는 VM에서 `docker login ghcr.io` |
| `invalid reference format: repository name must be lowercase` | GHCR 이름에 대문자 | 계정명을 소문자로 (`${OWNER,,}`) |
| 브라우저에서 사이트 접속 불가, VM 안 `curl localhost`는 정상 | NSG 80/443 미개방 | NSG 규칙 확인 |
| `502 Bad Gateway` | api 컨테이너 다운 · 시작 중 | `docker compose ps`, `docker compose logs api` (데이터 검증 실패로 종료했을 수 있음) |
| `/course` 새로고침 시 404 | nginx `try_files` 누락 | `location / { try_files $uri $uri/ /index.html; }` |
| certbot `Timeout during connect` / `unauthorized` | 80번 차단, 챌린지 경로 미설정, DNS 이름 오타 | NSG 80, `/.well-known/acme-challenge/` location, `nslookup <FQDN>` |
| nginx `cannot load certificate` | 인증서 발급 전 HTTPS 설정 적용 | `prod-http.conf`로 되돌린 뒤 발급 → 전환 (런북 05) |
| 보안 헤더 일부가 안 보임 | `location` 안의 `add_header`가 바깥 헤더를 덮음 | 필요한 헤더를 해당 location에도 추가하거나 `always` 헤더를 server 수준에만 |
| Actions `Host key verification failed` | `DEPLOY_KNOWN_HOSTS` 누락 · VM 재생성 | `ssh-keyscan <FQDN>` 결과로 Secret 갱신 |
| Actions 헬스 체크 실패, 사이트는 정상 | `version` 불일치 (빌드 인자 누락) | api Dockerfile의 `ARG/ENV APP_VERSION`, build-args 확인 |
| VM 메모리 부족 (`Killed`, OOM) | B1s(1GiB)에서 빌드하거나 컨테이너 과다 | 서버에서 빌드하지 않기, 스왑 파일 추가 검토 |
| 디스크 가득 참 | 오래된 이미지 · 로그 | `docker image prune -a`, daemon.json 로그 제한 확인 |

---

<!-- 아래에 기록 추가 -->
