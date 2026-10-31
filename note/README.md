# 학습 노트

해커톤 준비 중 정리한 개념 노트. 프로젝트 문서(`docs/`)와 달리 **배운 내용 자체**를 모아 둔다.

## Azure 기초 (`azure-basics/`)

MS Learn "Azure 기초(AZ-900)" 흐름을 따라 정리한 HTML 노트 13편. 시작은 [`azure-basics/목차.html`](azure-basics/목차.html) (브라우저로 열기).

| 묶음 | 노트 | 핵심 | 이 프로젝트에서 쓰는 곳 |
|---|---|---|---|
| 클라우드 개념 | [클라우드 컴퓨팅](azure-basics/클라우드%20컴퓨팅.html) | 공동 책임 모델, 퍼블릭 · 프라이빗 · 하이브리드, 소비 기반 과금 | VM은 OS 관리가 내 책임 (IaaS) |
| | [클라우드 서비스의 이점](azure-basics/클라우드%20서비스의%20이점.html) | 고가용성 · SLA, 확장성 · 탄력성, 예측 가능성 | 단일 VM의 한계 설명 |
| | [클라우드 서비스 유형](azure-basics/클라우드%20서비스%20유형.html) | IaaS · PaaS · SaaS 책임 범위 | VM(IaaS)을 고른 이유 |
| 아키텍처 · 서비스 | [Azure 핵심 아키텍처](azure-basics/Azure%20핵심%20아키텍처.html) | 지역 · 가용성 영역, 구독 · 리소스 그룹 · 관리 그룹 | `koreacentral`, `rg-cheongdo-course` |
| | [Azure 컴퓨팅 서비스](azure-basics/Azure%20컴퓨팅%20서비스.html) | VM, 컨테이너, Functions, App Service | Ubuntu VM + Docker Compose |
| | [Azure 네트워킹 서비스](azure-basics/Azure%20네트워킹%20서비스.html) | VNet, NSG, VPN Gateway, DNS | VNet · NSG(80 · 443 · 22 내 IP) · 공용 IP DNS 이름 |
| | [Azure Storage 서비스](azure-basics/Azure%20Storage%20서비스.html) | 스토리지 계정, 중복성, Blob 계층 | VM 관리 디스크 (사진은 원본 URL 사용으로 Blob 미사용) |
| | [Azure ID · 액세스 · 보안](azure-basics/Azure%20ID·액세스·보안.html) | Entra ID, RBAC, 제로 트러스트, 심층 방어 | SSH 키 인증, 최소 포트 공개 |
| 관리 · 거버넌스 | [Azure 비용 관리](azure-basics/Azure%20비용%20관리.html) | 가격 계산기, 비용 관리 · 예산, 태그 | 예산 알림, 자동 종료, 끝나면 리소스 그룹 삭제 |
| | [Azure 거버넌스 · 규정 준수](azure-basics/Azure%20거버넌스·규정%20준수.html) | Azure Policy, 리소스 잠금, Purview | 태그 정책 (선택) |
| | [Azure 리소스 관리 · 배포 도구](azure-basics/Azure%20리소스%20관리·배포%20도구.html) | 포털 · CLI · ARM · Bicep, IaC | **Terraform으로 VM · 네트워크 생성** (배포 단계) |
| | [Azure 모니터링 도구](azure-basics/Azure%20모니터링%20도구.html) | Azure Monitor, Log Analytics, Advisor, Service Health | VM 메트릭 · 로그 확인 |

> 배포 계획이 바뀌었다 (2026-10-31): Azure 리소스는 **Terraform**으로 만들고, 구현이 끝난 뒤 **한 번 배포**한다. GitHub Actions(CI/CD)는 쓰지 않는다. `docs/06-deploy/` 런북은 이 결정에 맞춰 배포 단계에서 다시 쓴다.
