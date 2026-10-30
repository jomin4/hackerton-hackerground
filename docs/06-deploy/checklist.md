# 배포 체크리스트

## 배포 전 (로컬)

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` 통과
- [ ] `npm run docker:up` 리허설에서 홈 → 결과 → 상세 → 상태 화면 확인
- [ ] 커밋에 비밀 값 · `.env` 없음 (`git diff --cached`로 확인)
- [ ] `spots.json` 변경 시 출처 · 확인 날짜 갱신
- [ ] API · 데이터 구조 변경 시 문서(`api-spec.md`, `data-model.md`) 갱신

## 배포 중 (GitHub Actions)

- [ ] `ci` → `image` → `deploy` 모두 성공
- [ ] 실패 시 로그의 첫 번째 오류부터 확인 → [`troubleshooting.md`](troubleshooting.md)

## 배포 후 (운영, 5분 점검)

| # | 확인 | 방법 | 기대 |
|---|---|---|---|
| 1 | 버전 | `https://<FQDN>/api/health` | `version` = 머지 커밋 SHA, `spots` > 0 |
| 2 | HTTPS | 브라우저 자물쇠, `http://` 접속 | 유효 인증서, https로 이동 |
| 3 | 핵심 흐름 | 홈 → 코스 만들기 → 상세 → 돌아가기 | 정상, 4시간 가족 자연·체험 = 215분 |
| 4 | 새로고침 | `/course?...`, `/spots/wine-tunnel`에서 F5 | 404 없이 화면 |
| 5 | 오류 화면 | `/course?hours=99&with=family&tags=nature`, `/spots/nope` | 400 · 404 화면 |
| 6 | 모바일 | 휴대폰으로 접속 | 가로 스크롤 없음 |
| 7 | 헤더 | `curl.exe -I https://<FQDN>/` | HSTS · nosniff 등 보안 헤더 |
| 8 | 캐시 | `curl.exe -I https://<FQDN>/assets/<파일>.js` | `immutable` |
| 9 | 로그 | `docker compose logs --tail=50 api` | error 없음 |
| 10 | 리소스 | `docker stats --no-stream`, `df -h /` | 메모리 · 디스크 여유 |

## 문제 시

1. 사용자 영향이 크면 **먼저 롤백** ([런북 07](runbooks/07-monitoring-rollback.md#4-롤백-연습)), 원인 분석은 그다음
2. 원인 · 해결을 [`troubleshooting.md`](troubleshooting.md)에 기록
