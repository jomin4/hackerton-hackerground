# 04 — 코스 API

- **목적**: 추천 알고리즘을 `GET /api/course`로 노출한다.
- **선행 조건**: 02, 03 완료
- **학습 포인트**: 쿼리 검증 → 도메인 호출 → 응답 변환의 얇은 라우트

## 프롬프트

```text
apps/api 에 GET /api/course 를 구현해줘.

참고 문서:
#file:docs/03-architecture/api-spec.md
#file:docs/03-architecture/data-model.md
#file:docs/04-dev/testing.md

만들 것:
- src/routes/course.ts
  - req.query 를 @cheongdo/shared 의 courseQuerySchema 로 검증 (실패 시 ZodError → 기존 에러 미들웨어가 400 처리)
  - exclude 에 있는 id 중 존재하지 않는 id는 무시 (에러 아님)
  - recommendCourse(spots.findAll(), query) 결과를 그대로 JSON 응답
  - Cache-Control: public, max-age=300
- src/app.ts 에 라우트 등록
- 400 에러 message 는 api-spec.md 예시처럼 화면에 바로 보여줄 수 있는 한국어 문장. 여러 필드가 틀리면 첫 번째 필드 기준 message, details 에는 전부
- test/routes/course.test.ts: testing.md API 표의 /api/course 행 전부
  - 정상 요청은 T1 결과(순서, totals)와 일치하는지
  - 400 응답의 details[0].field 확인
  - tags 순서를 바꿔 보내도(experience,nature) 결과와 conditions.tags 가 같은지

제약:
- 라우트에 비즈니스 로직을 넣지 마 (검증 → 호출 → 응답만)
- domain/recommend-course.ts 는 수정하지 마. 수정이 필요하면 이유를 보고해

완료 기준:
- npm test -w apps/api 통과
- npm run typecheck, npm run lint 통과
- npm run dev -w apps/api 후 브라우저에서
  http://localhost:3000/api/course?hours=4&with=family&tags=nature,experience → totals.totalMinutes 215
  http://localhost:3000/api/course?hours=99&with=family&tags=nature → 400

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과, 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] 라우트 파일이 짧고 로직 없음
- [ ] 빈 결과는 200 (`stops: []`), 400 아님
- [ ] `tags` 순서가 달라도 같은 응답
- [ ] 400 `message`가 사용자용 한국어
- [ ] `exclude`의 없는 id 무시
