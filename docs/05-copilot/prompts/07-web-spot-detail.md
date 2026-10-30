# 07 — 관광지 상세 화면

- **목적**: `/spots/:id` 화면을 구현한다.
- **선행 조건**: 02, 05 완료 (06과 병행 가능)
- **학습 포인트**: 선택 필드(없을 수 있는 데이터) 처리, 외부 링크, 출처 표기

## 프롬프트

```text
apps/web 에 관광지 상세 페이지(/spots/:id)를 구현해줘.

참고 문서:
#file:docs/02-design/ui-screens.md
#file:docs/02-design/design-tokens.md
#file:docs/03-architecture/api-spec.md
#file:docs/03-architecture/data-model.md

만들 것:
- src/hooks/useSpot.ts: /api/spots/:id 호출, useCourse 와 같은 반환 형태, 404는 error.code 로 구분 가능하게
- src/pages/SpotPage.tsx (ui-screens.md "03 관광지 상세")
  - 상단: 브레드크럼(홈 / 추천 코스 / 장소명 — from 쿼리가 있을 때만 "추천 코스" 표시), "코스로 돌아가기"(from 쿼리가 있으면 /course?<from>, 없으면 홈)
  - 대표 이미지 영역: 높이 360px(모바일 220px), bg-ink, 아치 패턴 SVG 일러스트(aria-hidden). 사진은 쓰지 마
  - 제목 영역: 권역 칩 + 태그들, 이름, summary, 버튼 "주소 복사"(2초간 "복사됨") / "지도에서 보기"(https://map.naver.com/p/search/<encodeURIComponent(name)>, target=_blank rel=noopener)
  - 좌: 소개(description 문단들), 방문 팁(번호 목록, tips 가 비면 섹션 숨김), 같은 권역의 장소(nearby 카드, 없으면 숨김, "차로 약 10분 · 체류 N분")
  - 우: 이용 정보 dl — 주소 / 운영시간(평일·주말·note) / 휴무일 / 입장료 / 권장 체류 / 문의. 값이 없는 항목은 "방문 전 확인"으로 표시.
    하단 출처 문구: checkedAt 이 있으면 "출처: {source} · {checkedAt} 기준. 방문 전 확인하세요.", 없으면 "출처: {source}. 운영 정보는 방문 전 확인하세요."
  - from 쿼리가 있으면 "이 코스에서" 카드: 코스 안 순번(N / 전체), 이전·다음 장소와 이동 시간 (useCourse 를 from 쿼리로 호출해 계산 없이 응답에서 찾기)
- 문서 제목(document.title)을 "{장소명} — 청도 코스"로
- SpotPage.test.tsx: hours/fee 가 없는 장소는 "방문 전 확인"이 보이는지, tips 가 비면 방문 팁 섹션이 없는지, checkedAt 이 없으면 "기준" 문구 없이 출처만 보이는지

제약:
- 데이터에 없는 정보를 화면에 지어내지 마
- 색은 토큰 클래스만, 이모지 금지

완료 기준:
- npm test -w apps/web, npm run typecheck, npm run lint 통과
- /spots/wine-tunnel 에서 운영시간·문의·출처가 데이터대로 보임
- /spots/rail-bike 에서 운영시간이 "방문 전 확인"으로 보임
- 코스 결과 → 상세 → "코스로 돌아가기" 시 같은 코스로 복귀

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] 없는 필드를 "방문 전 확인"으로 처리, 빈 칸 · `undefined` 노출 없음
- [ ] 출처 표시, 기준일은 `checkedAt`이 있을 때만 (`undefined 기준` 같은 노출 없음)
- [ ] 외부 링크 `rel="noopener"`
- [ ] `from` 없이 직접 들어와도 정상 동작
- [ ] 문서 제목 변경
