# 런북 07 — 모니터링 · 롤백 · 비용 관리

## 이번에 배울 것

| 개념 | 한 줄 정의 | MS Learn |
|---|---|---|
| Azure Monitor 지표 | VM의 CPU · 네트워크 · 디스크 수치를 기본으로 수집 | 관리 · 거버넌스 (3부) |
| 경고 (Alert) | 지표가 기준을 넘으면 알림 | 관리 · 거버넌스 |
| 자동 종료 | 정해진 시간에 VM을 할당 취소 | 비용 관리 |
| 롤백 | 이전 버전 이미지로 되돌리기 | — |

## 왜 하는가

배포는 끝이 아니다. 서비스가 살아 있는지, 문제가 생기면 얼마나 빨리 되돌릴 수 있는지, 비용이 새고 있지 않은지 알아야 한다.

## 실행

### 1. 로그 보기 (VM)

```bash
cd /opt/cheongdo-course
docker compose ps
docker compose logs -f --tail=100 web     # nginx 접근 로그
docker compose logs -f --tail=100 api     # pino JSON 로그
docker compose logs api | grep '"level":50'   # error 수준만
docker stats --no-stream                  # 컨테이너 CPU · 메모리
df -h /                                   # 디스크
```

### 2. Azure Monitor 지표 (포털)

포털 → `vm-cheongdo-course` → **모니터링 › 메트릭**

- `Percentage CPU`, `Available Memory Bytes`, `Network In Total`을 차트로 추가
- **대시보드에 고정**

경고 규칙: VM → **경고 › 경고 규칙 만들기**

| 조건 | 기준 | 작업 |
|---|---|---|
| Percentage CPU | 평균 > 80%, 5분 | 이메일 |
| VM 가용성 (Availability) | < 1 | 이메일 |

### 3. 외부 상태 확인 (선택)

무료 업타임 모니터링 서비스에 `https://<FQDN>/api/health`를 5분 간격으로 등록하면 서비스 중단을 바로 알 수 있다.

### 4. 롤백 연습

```bash
cd /opt/cheongdo-course
grep IMAGE_TAG .env                                   # 현재 버전
docker image ls | grep cheongdo-course                # 서버에 남은 버전들
# GHCR 패키지 페이지에서 이전 SHA 태그 확인 후
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<이전 SHA>/' .env
docker compose pull && docker compose up -d
curl -s https://<FQDN>/api/health                     # version 이 이전 SHA인지
```

> 다음 push 배포 때 `IMAGE_TAG`는 다시 새 SHA로 바뀐다. 근본 수정은 `git revert` → PR → 머지로 한다.

롤백에 걸린 시간을 재서 learning-log에 기록한다 (목표: 2분 이내).

### 5. 비용 관리

**자동 종료** (연습 기간 중 밤에 꺼지게):

```powershell
az vm auto-shutdown -g rg-cheongdo-course -n vm-cheongdo-course --time 1500 --email <본인 이메일>
```

`--time`은 **UTC** 기준 `HHMM`이다. `1500` UTC = 한국 시간 자정.

**비용 확인**: 포털 → 비용 관리 → **비용 분석** → 범위 `rg-cheongdo-course`, 그룹화 "리소스"

**완전 정리** (프로젝트 종료 시):

```powershell
az group delete --name rg-cheongdo-course --yes --no-wait
```

GHCR 패키지와 GitHub Secrets의 배포 키도 함께 정리한다.

## 확인

- [ ] 메트릭 차트가 대시보드에 고정됨
- [ ] 경고 규칙 2개 생성, 테스트 알림 수신
- [ ] 롤백 → 원복까지 직접 해 봄, 소요 시간 기록
- [ ] 자동 종료 설정, 비용 분석에서 리소스별 비용 확인

## 이해 점검

1. Azure Monitor가 기본으로 볼 수 있는 것과, VM 안의 애플리케이션 로그(pino)는 어떻게 다른가?
2. `latest` 태그만 썼다면 롤백이 왜 어려워지나?
3. 할당 취소된 VM에서도 계속 과금되는 리소스는 무엇인가?
