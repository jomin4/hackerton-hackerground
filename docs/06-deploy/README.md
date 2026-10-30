# 배포 가이드 (직접 실행 영역)

> 이 영역은 **개발자 본인이 직접** 실행한다. Claude는 런북 작성과 막혔을 때의 디버깅을 돕는다.
> 각 런북은 "따라 하는 가이드"이자 "Azure 학습 노트"다.

## 목표 구조

[운영 배포 환경 다이어그램](https://app.eraser.io/workspace/eleuIDG7FlT0ljg5vO7c?diagram=U3lOpwgIeyOmkbbpMLQU&layout=canvas) · 설명: [`../03-architecture/system-overview.md`](../03-architecture/system-overview.md)

## 로드맵

| # | 런북 | 결과 | Azure 학습 연결 (MS Learn) | 예상 |
|---|---|---|---|---|
| 01 | [계정 · 리소스 그룹](runbooks/01-account-resource-group.md) | 구독, 리소스 그룹, 예산 알림 | 클라우드 개념(사용량 기반 과금) · 핵심 아키텍처 구성 요소(지역, 구독, 리소스 그룹) | 30분 |
| 02 | [VM · 네트워크 · NSG](runbooks/02-vm-network-nsg.md) | Ubuntu VM, 공용 IP · DNS 이름, 방화벽 | 컴퓨팅 서비스(VM, IaaS) · 네트워킹(VNet, NSG, 공용 IP) · 스토리지(관리 디스크) | 45분 |
| 03 | [서버 초기 설정](runbooks/03-server-setup.md) | SSH 접속, 업데이트, Docker 설치 | 공동 책임 모델(OS는 내 책임) · ID · 보안(SSH 키) | 40분 |
| 04 | [첫 수동 배포](runbooks/04-first-manual-deploy.md) | HTTP로 서비스 공개 | 컨테이너 이미지 · 레지스트리 | 40분 |
| 05 | [HTTPS](runbooks/05-https-certbot.md) | Let's Encrypt 인증서, 자동 갱신 | 네트워크 보안 · DNS | 40분 |
| 06 | [CI/CD](runbooks/06-cicd-github-actions.md) | push → 자동 배포 | (GitHub) Actions · Secrets | 60분 |
| 07 | [모니터링 · 롤백 · 비용](runbooks/07-monitoring-rollback.md) | 로그 · 지표 확인, 롤백 연습, 자동 종료 | Azure Monitor · 비용 관리 | 40분 |

**순서가 중요하다**: 04에서 손으로 배포해 보고 나서 06에서 자동화한다. 파이프라인이 하는 일을 이미 알고 있어야 실패했을 때 고칠 수 있다.

## 런북 형식

모든 런북은 같은 구조다.

1. **이번에 배울 것** — Azure 개념과 MS Learn 모듈
2. **왜 하는가** — 이 단계가 없으면 생기는 문제
3. **실행** — 명령과 포털 경로 (복사해서 실행)
4. **확인** — 성공했는지 보는 방법
5. **이해 점검** — 스스로 답해 볼 질문 (답을 `../07-study/learning-log.md`에 기록)
6. **정리 · 비용** — 실습 후 꺼 두기 등

## 진행 규칙

- 명령은 **이해하고 실행**한다. 모르는 옵션은 `--help`나 MS Learn에서 찾아보고 learning-log에 적는다.
- 막히면: 실행한 명령 + 오류 전문 + 지금까지 한 단계를 설계 세션(Claude)에 공유한다.
- 해결한 문제는 [`troubleshooting.md`](troubleshooting.md)에 남긴다.
- 배포 전후에는 [`checklist.md`](checklist.md)를 따른다.

## 명명 규칙

| 리소스 | 이름 |
|---|---|
| 리소스 그룹 | `rg-cheongdo-course` |
| VM | `vm-cheongdo-course` |
| 공용 IP DNS 레이블 | `cheongdo-course-<본인 이니셜>` → `cheongdo-course-xx.koreacentral.cloudapp.azure.com` |
| 지역 | `koreacentral` (한국 중부) |
| 태그 | `project=cheongdo-course`, `env=prod`, `owner=<본인>` |

## 비용 원칙

- VM은 **켜져 있는 시간만큼** 과금된다. 실습이 끝나면 `az vm deallocate`(할당 취소)로 멈춘다. OS 안에서 `shutdown`만 하면 과금이 계속될 수 있다.
- 무료 계정 · Azure for Students 크레딧과 무료로 제공되는 VM 크기는 시기마다 바뀌므로 **가입 시점의 혜택 안내와 포털의 비용 분석**으로 확인한다.
- 런북 01에서 예산 알림을 먼저 걸고 시작한다.
- 해커톤이 끝나고 더 이상 쓰지 않으면 리소스 그룹째 삭제한다.
