# 06 — 코스 결과 화면

- **목적**: `/course` 화면을 구현한다. 서비스의 결과물이 보이는 가장 중요한 화면.
- **선행 조건**: 04, 05 완료
- **학습 포인트**: URL → API 호출 훅, 타임라인 레이아웃, 반응형 2단 → 1단

## 프롬프트

```text
apps/web 에 코스 결과 페이지(/course)를 구현해줘.

참고 문서:
#file:docs/02-design/ui-screens.md
#file:docs/02-design/design-tokens.md
#file:docs/03-architecture/api-spec.md
#file:docs/01-product/user-flow.md

만들 것:
- src/hooks/useCourse.ts: URL 쿼리를 그대로 /api/course 에 전달, { status: 'loading' | 'success' | 'error', data, error } 반환. 쿼리가 바뀌면 다시 요청, 이전 요청은 AbortController로 취소
- src/pages/CoursePage.tsx (ui-screens.md "02 코스 결과")
  - 상단(bg-surface-2): 브레드크럼 "홈 / 추천 코스", 제목 "{동행}과 함께하는 {N}시간 청도 코스"(혼자면 "혼자 떠나는 N시간 청도 코스"), 조건 칩(시계 아이콘+시간, 동행, 관심사들), 버튼 "조건 수정"(홈으로, 현재 조건 쿼리 유지) / "링크 복사"(navigator.clipboard, 2초간 "복사됨" + 체크 아이콘, 실패 시 URL을 선택 가능한 입력창으로 보여주기)
  - 본문 2단: 좌 타임라인(flex 999 1 560px) / 우 요약(flex 1 1 320px), 좁아지면 요약이 아래로. 모바일(<768px)에서는 요약이 타임라인 위로 (CSS order)
- src/components/course/
  - CourseTimeline: ol, 각 stop = 번호 원(검정, 모노) + 세로선(line-strong, 마지막 제외) + StopCard + 다음 장소까지 이동 행("차로 약 25분 · 청도읍 → 화양읍" / 같은 권역이면 "같은 권역")
  - StopCard: 이름, 권역 칩(MapPin), 시각 범위 formatClock("0:00 – 1:00", font-mono), 요약, 일치 태그(bg-accent-soft text-accent-text + 체크), 추천 이유("관심사 2개 일치 · 가족 추천" 형식), 체류, "상세 보기" 링크(/spots/:id?from=<현재 쿼리 인코딩>)
  - CourseSummary: 총 소요(큰 숫자 formatDuration) / 예산, 체류·이동·여유 비율 막대(div 3개, role="img" + aria-label 에 세 값 문장), 범례(색 사각형 + 텍스트), 장소 수 · 권역 목록
  - ExcludedSpots: excluded 가 있을 때만. 이름 + 체류, 하단 링크 "{다음 시간}시간 코스로 다시 만들기"(hours가 6 미만일 때만. 2→4, 4→6. 나머지 조건은 그대로)
  - 계산 가정 안내 박스 (이동 시간 가정 문구)
- 로딩/빈 결과/오류는 08에서 다듬을 예정이니 지금은 간단한 텍스트 자리표시로 두고 컴포넌트 이름만 정해둬: CourseSkeleton, EmptyCourse, ErrorState
- CoursePage.test.tsx: fetch 를 mock 해서 T1 응답을 주면 장소 4개가 순서대로 렌더되고 "3시간 35분"이 보이는지

제약:
- 계산은 서버 응답 값만 사용 (화면에서 다시 계산하지 마). 비율 막대 폭만 화면에서 계산
- 색은 토큰 클래스만, 이모지 금지

완료 기준:
- npm test -w apps/web, npm run typecheck, npm run lint 통과
- npm run dev 후 홈에서 "코스 만들기" → 결과 화면에 레일바이크 → 유등연지 → 와인터널 → 청도읍성, 총 3시간 35분
- "링크 복사" 후 새 탭에 붙여 넣으면 같은 결과
- 390px 폭에서 요약이 타임라인 위, 가로 스크롤 없음
- 접근성: 버튼 · 링크 터치 영역 44px 이상, 글자 12px 이상, 05의 :focus-visible 을 덮어쓰지 않음(outline-none 금지)

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] 화면에서 코스를 재계산하지 않음
- [ ] 쿼리 변경 시 이전 요청 취소 (깜빡임 · 경쟁 상태 없음)
- [ ] 상세 링크에 `from` 쿼리가 붙어 돌아올 수 있음
- [ ] 비율 막대에 텍스트 대안(`aria-label`) + 범례 텍스트
- [ ] 제목 조사 처리(가족과 / 혼자 떠나는 / 커플과 / 친구와)
