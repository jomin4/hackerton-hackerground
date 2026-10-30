# 런북 01 — 계정 · 리소스 그룹 · 예산

## 이번에 배울 것

| 개념 | 한 줄 정의 | MS Learn |
|---|---|---|
| 사용량 기반 과금 (OpEx) | 쓴 만큼 내는 클라우드 비용 모델 | 클라우드 개념 › 클라우드 서비스 사용의 이점 |
| 구독 (Subscription) | 결제와 권한의 경계. 리소스는 반드시 하나의 구독에 속함 | 핵심 아키텍처 구성 요소 |
| 리소스 그룹 | 함께 만들고 함께 지우는 리소스 묶음 | 핵심 아키텍처 구성 요소 |
| 지역 (Region) | 데이터센터가 있는 위치. 한국은 `koreacentral`, `koreasouth` | 핵심 아키텍처 구성 요소 |
| 태그 | 리소스에 붙이는 키-값 라벨 (비용 분류용) | 관리 · 거버넌스 (3부) |

## 왜 하는가

리소스를 한 그룹에 모아 두면 비용을 한눈에 보고, 실습이 끝났을 때 **그룹 삭제 한 번으로 전부 정리**할 수 있다. 예산 알림이 없으면 VM을 켜 둔 채 잊어서 크레딧이 소진될 수 있다.

## 실행

### 1. 구독 확인

포털(https://portal.azure.com) → **구독**에서 사용할 구독(무료 체험 / Azure for Students 등)이 "활성"인지 확인.

### 2. Azure CLI 로그인

```powershell
az login
az account list -o table
az account set --subscription "<구독 이름 또는 ID>"
az account show -o table
```

### 3. 리소스 그룹 만들기

```powershell
az group create `
  --name rg-cheongdo-course `
  --location koreacentral `
  --tags project=cheongdo-course env=prod owner=<본인>
```

### 4. 예산 알림 (포털)

포털 → **비용 관리 + 청구** → **비용 관리** → **예산** → **추가**

| 항목 | 값 |
|---|---|
| 범위 | 리소스 그룹 `rg-cheongdo-course` |
| 이름 | `budget-cheongdo-course` |
| 기간 | 월별 |
| 금액 | 본인 크레딧에 맞춰 (예: 크레딧의 20%) |
| 알림 | 실제 비용 50%, 80%, 100% → 본인 이메일 |

## 확인

```powershell
az group show --name rg-cheongdo-course -o table
```

포털 → 리소스 그룹 → `rg-cheongdo-course` → **태그**에 3개, **비용 관리 › 예산**에 알림이 보이면 완료.

## 이해 점검

1. 구독과 리소스 그룹의 차이는? 리소스 그룹을 지우면 무엇이 지워지는가?
2. 왜 `koreacentral`을 골랐나? 지역을 다르게 고르면 무엇이 달라지는가(지연 시간, 가격, 서비스 제공 여부)?
3. 예산은 비용을 "막아" 주는가, "알려" 주는가?

## 정리 · 비용

리소스 그룹 자체는 무료다. 이 단계에서는 과금되는 리소스가 없다.
