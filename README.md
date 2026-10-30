# 청도 코스 메이커

여행 시간 · 동행 · 관심사 세 가지만 고르면, 시간 안에 돌 수 있는 청도 관광 코스를 방문 순서와 이동 시간까지 계산해 보여주는 웹 서비스.

> 2026 청도 바이브코딩 해커톤 대비 연습 프로젝트 · GitHub Copilot으로 구현 · Azure에 배포

## 구조

```
cheongdo-course/
├── apps/
│   ├── web/              # React + Vite + Tailwind (화면)
│   └── api/              # Express + TypeScript (API · 코스 추천)
├── packages/
│   └── shared/           # 공유 타입 · 상수 · zod 스키마
├── infra/                # nginx · Docker Compose · 서버 스크립트
├── docs/                 # 기획 · 설계 · 프롬프트 · 배포 런북 · 학습 기록
└── .github/
    ├── copilot-instructions.md   # Copilot 프로젝트 규칙
    └── workflows/                # CI/CD
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | React, Vite, React Router, Tailwind CSS, TypeScript |
| 백엔드 | Express, TypeScript, zod, pino |
| 테스트 | Vitest, Supertest |
| 인프라 | Docker Compose, nginx, Azure VM (Ubuntu 24.04), Let's Encrypt |
| CI/CD | GitHub Actions, GitHub Container Registry |

선택 이유: [`docs/00-overview/decisions/0001-tech-stack.md`](docs/00-overview/decisions/0001-tech-stack.md)

## 시작하기

```bash
npm install
npm run dev          # http://localhost:5173
```

자세한 내용: [`docs/04-dev/local-setup.md`](docs/04-dev/local-setup.md)

## 문서

[`docs/README.md`](docs/README.md)에서 전체 문서 지도를 볼 수 있다.

## 진행 상황

- [x] 기획 · 설계 · UI 디자인
- [ ] Copilot 구현 (프롬프트 01~09)
- [ ] Azure 배포 (런북 01~07)
- [ ] 모의 해커톤
