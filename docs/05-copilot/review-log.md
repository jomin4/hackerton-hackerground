# Copilot 작업 리뷰 기록

> 프롬프트 하나를 끝낼 때마다 한 블록씩 추가한다. 해커톤 회고와 치트시트의 원재료가 된다.

## 요약표

| # | 프롬프트 | 시작 | 완료 | 재시도 | 결과 | PR |
|---|---|---|---|---|---|---|
| 01 | scaffold-monorepo | 2026-10-30 | 2026-10-30 | 1 | ☑ | |
| 02 | api-spots | | | | ☐ | |
| 03 | recommend-course | | | | ☐ | |
| 04 | api-course | | | | ☐ | |
| 05 | web-layout-home | | | | ☐ | |
| 06 | web-course-result | | | | ☐ | |
| 07 | web-spot-detail | | | | ☐ | |
| 08 | web-states | | | | ☐ | |
| 09 | dockerize | | | | ☐ | |

## 기록 양식

```markdown
### NN — 제목 (YYYY-MM-DD)

- 소요: 투입 → 완료 N분, 재시도 N회
- 모델 / 모드: (예: Agent 모드, 기본 모델)
- 결과: 완료 기준 통과 여부
- 리뷰 지적 사항:
  - (Claude 리뷰에서 나온 문제와 처리)
- Copilot이 잘한 점:
- Copilot이 틀린 점 / 반복된 실수:
- 다음 프롬프트에 반영할 것:
- 해커톤용으로 저장할 표현:
```

---

<!-- 아래에 기록 추가 -->

### 01 — scaffold-monorepo (2026-10-30)

- 소요: 1차 투입 → 리뷰 → 수정 프롬프트 1회, 재시도 1회
- 모델 / 모드: Agent 모드, 기본 모델
- 결과: 완료 기준 통과 — typecheck · lint · test(17개) · `prettier --check` (리뷰에서 직접 재실행)
- 설치 버전: TypeScript 6.0, ESLint 10, Vitest 5, zod 4.6, typescript-eslint 8.72
- 리뷰 지적 사항:
  - `courseQuerySchema`의 `hours` 출력 타입이 `number`라 `CourseQuery`(`2 | 4 | 6`)에 대입 불가 → `z.coerce.number().pipe(z.literal(HOURS))`로 수정, 제네릭 기본값 제약으로 컴파일 타임 검사 추가
  - zod 기본 영어 메시지가 그대로 노출됨 (`with` 메시지는 data-model.md에 있었는데 누락) → hours · with · tags · tag · zone 전부 한국어 메시지 + 테스트
  - `npm run format`이 `docs/` 마크다운 32개를 재정렬 → `.prettierignore`에 `*.md`
  - 워크스페이스 package.json에 `"private": true` 누락 → 추가
- Copilot이 잘한 점: 상수 · 타입 이름과 값이 문서와 정확히 일치. 불필요한 패키지 없음. 타입 호환 검사를 런타임 코드 없는 방식으로 더 깔끔하게 구현
- Copilot이 틀린 점 / 반복된 실수: 문서의 메시지를 빼먹고도 "문서와 다른 부분 없음"이라고 보고함 → **자기 보고를 믿지 말고 문서 값과 대조**
- 다음 프롬프트에 반영할 것: 타입 수준 검증(스키마 출력 ↔ 공유 타입)을 완료 기준에 넣기. 사용자에게 보이는 문구는 "정확히 일치" 테스트로 고정
- 해커톤용으로 저장할 표현: "z.infer 결과가 공유 타입에 대입되는지 타입 수준에서 보장하는 코드를 추가해줘"
