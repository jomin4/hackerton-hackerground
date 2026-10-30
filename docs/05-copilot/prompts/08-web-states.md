# 08 — 상태 화면 (로딩 · 빈 결과 · 400 · 404 · 오류)

- **목적**: 정상 응답이 아닌 모든 경우를 디자인대로 처리해 "실제 쓸 수 있는" 완성도를 만든다.
- **선행 조건**: 06, 07 완료
- **학습 포인트**: API 오류 코드 ↔ 화면 매핑, 스켈레톤, `role="status"`

## 프롬프트

```text
apps/web 의 상태 화면을 디자인대로 완성해줘. 06, 07에서 자리표시로 둔 CourseSkeleton, EmptyCourse, ErrorState 를 구현하고 404 페이지를 만들어.

참고 문서:
#file:docs/02-design/ui-screens.md
#file:docs/01-product/user-flow.md
#file:docs/03-architecture/api-spec.md

구현 (ui-screens.md "05 상태 화면" 표 기준):
- CourseSkeleton: 제목 바, 칩 3개, 번호 원 + 카드 2개 스켈레톤(bg-fill/연한 회색), 아래에 회전 아이콘 + "코스를 계산하고 있어요". 컨테이너에 role="status" aria-live="polite". prefers-reduced-motion 이면 회전 애니메이션 끔
- EmptyCourse (200 + stops 빈 배열): 돋보기 아이콘 박스, "조건에 맞는 장소를 찾지 못했어요", 원인 문장("{N}시간 안에 담을 수 있는 '{관심사들}' 장소가 없어요. 여행 시간을 늘리거나 관심사를 더 골라보세요."), 버튼 "{다음 시간}시간으로 늘리기"(6시간이면 숨김) / "관심사 더 고르기"(홈으로, 현재 조건 유지)
- ErrorState 를 code 별로:
  - INVALID_QUERY(400): 경고 아이콘, "조건을 다시 확인해 주세요", 현재 URL 쿼리를 code 박스로 보여주고 details 의 문제 field 값만 text-accent-text 로 강조, error.message 표시, "조건 다시 고르기"
  - SPOT_NOT_FOUND(404): 모노 "404", "찾는 장소가 없어요", "주소가 바뀌었거나 목록에서 빠진 장소예요...", "관광지 목록으로"(/#spots) / "홈으로"
  - 네트워크·500: "잠시 문제가 생겼어요", "다시 시도" 버튼(재요청)
- NotFoundPage (라우트 *): SPOT_NOT_FOUND 와 같은 디자인, 문구만 "페이지를 찾을 수 없어요"
- 각 상태 컴포넌트 테스트: code 별 렌더링, 버튼 링크 대상

제약:
- 아이콘은 icons.tsx 에 추가 (Search, AlertTriangle, RefreshCw)
- 색은 토큰 클래스만, 이모지 금지

완료 기준:
- npm test -w apps/web, npm run typecheck, npm run lint 통과
- 브라우저에서 직접 확인:
  /course?hours=2&with=solo&tags=food 에서 food 장소만 나오거나 빈 결과(데이터에 따라)
  /course?hours=99&with=family&tags=nature → 400 화면, "99" 강조
  /spots/nope → 404 화면
  /아무경로 → 404 페이지
  개발자 도구에서 Network 를 Slow 3G 로 두고 /course → 스켈레톤 보임
  API 서버를 끄고 /course → "다시 시도" 화면

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] 모든 API 오류 코드가 화면에 매핑됨 (처리 안 된 경로 없음)
- [ ] 로딩에 `role="status"`, 모션 감소 설정 존중
- [ ] 400 화면의 강조가 `details` 기반 (하드코딩 아님)
- [ ] "다시 시도"가 실제로 재요청
