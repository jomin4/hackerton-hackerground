# 디자인 토큰

> 확정된 UI 디자인에서 추출한 값. Tailwind CSS v4의 `@theme`로 옮겨 쓴다.
> 스타일 방향: Vercel 계열 — 흰 바탕, 검정 텍스트, 1px 회색 테두리, 강조색 하나(청도 반시의 감색).

## 색

| 토큰 | 값 | 용도 |
|---|---|---|
| `ink` | `#0A0A0A` | 본문 텍스트, 주 버튼 배경, 선택된 버튼 |
| `ink-2` | `#333333` | 긴 본문 문단 |
| `ink-3` | `#444444` | 보조 텍스트, 칩 텍스트 |
| `muted` | `#666666` | 설명 문구 (대비 기준 최소값) |
| `subtle` | `#737373` | 모노 라벨, 번호 (큰 글씨 · 보조 정보에만) |
| `line` | `#EAEAEA` | 카드 · 헤더 테두리 |
| `line-soft` | `#F0F0F0` | 카드 내부 구분선 |
| `line-strong` | `#D4D4D4` | 타임라인 연결선 |
| `surface` | `#FFFFFF` | 기본 배경 |
| `surface-2` | `#FAFAFA` | 섹션 배경, 카드 하단 영역 |
| `fill` | `#F2F2F2` | 태그 배경, 비활성 버튼 |
| `grid` | `#F3F3F3` | 히어로 격자선 |
| `accent` | `#E8590C` | 로고, 이동 시간 막대, 포인트 (감색) |
| `accent-text` | `#C2410C` | 강조 텍스트 (흰 바탕 대비 확보용) |
| `accent-soft` | `#FFF1E8` | 일치 태그 배경 |

`accent`(#E8590C)는 흰 바탕 위 작은 글씨에 쓰면 대비가 부족하다 → 글씨에는 `accent-text`를 쓴다.

## 글꼴

| 토큰 | 값 | 용도 |
|---|---|---|
| `font-sans` | `'Geist', 'Noto Sans KR', system-ui, sans-serif` | 전체 |
| `font-mono` | `'Geist Mono', ui-monospace, monospace` | 시각, 번호, 코드, 섹션 라벨 |

Google Fonts: Geist(400 · 500 · 600 · 700), Geist Mono(400 · 500), Noto Sans KR(400 · 500 · 700)

## 글자 크기

| 용도 | 크기 / 굵기 / 자간 |
|---|---|
| 히어로 제목 | `clamp(38px, 5vw, 64px)` / 700 / -0.04em / 행간 1.08 |
| 페이지 제목 | `clamp(28px, 3.4vw, 42px)` / 700 / -0.035em |
| 섹션 제목 | `clamp(28px, 3.2vw, 40px)` / 700 / -0.035em |
| 카드 제목 | 18–19px / 600 / -0.02em |
| 본문 | 15–16px / 400 / 행간 1.65–1.8 |
| 보조 | 13–14px |
| 라벨 · 칩 | 12px |
| 섹션 라벨 (모노) | 12px / 자간 0.06em / 대문자 / `accent-text` |

## 간격 · 모양

| 토큰 | 값 |
|---|---|
| 컨테이너 | 최대 1200px, 좌우 24px (모바일 16px) |
| 섹션 세로 여백 | 88–96px |
| 카드 안쪽 여백 | 20–24px (모바일 14–16px) |
| 요소 간격 | 8 · 12 · 16 · 24 · 48px |
| 반경 | 버튼 8px, 선택 버튼 10px, 카드 14px, 대표 이미지 16px, 칩 999px, 태그 6px |
| 그림자 | 조건 카드만: `0 1px 2px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.06)` |
| 최소 터치 영역 | 44px |

## Tailwind v4 적용 예 (`apps/web/src/index.css`)

```css
@import "tailwindcss";

@theme {
  --color-ink: #0A0A0A;
  --color-ink-2: #333333;
  --color-ink-3: #444444;
  --color-muted: #666666;
  --color-subtle: #737373;
  --color-line: #EAEAEA;
  --color-line-soft: #F0F0F0;
  --color-line-strong: #D4D4D4;
  --color-surface: #FFFFFF;
  --color-surface-2: #FAFAFA;
  --color-fill: #F2F2F2;
  --color-grid: #F3F3F3;
  --color-accent: #E8590C;
  --color-accent-text: #C2410C;
  --color-accent-soft: #FFF1E8;

  --font-sans: "Geist", "Noto Sans KR", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;

  --radius-card: 14px;
  --radius-control: 10px;
  --shadow-card: 0 1px 2px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.06);
}
```

사용 예: `border border-line rounded-card bg-surface`, `text-muted`, `font-mono text-subtle`, `bg-accent-soft text-accent-text`

## 금지 사항

그라데이션 배경, 왼쪽 굵은 테두리 카드, 이모지, 색만으로 의미 구분(막대 그래프는 범례 텍스트 병기)
