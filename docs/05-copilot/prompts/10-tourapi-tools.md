# 10 — TourAPI 수집 도구

- **목적**: 청도군 관광 정보를 TourAPI에서 모아 로컬 초안과 후보표를 만드는 도구를 저장소에 둔다.
- **선행 조건**: 소유자의 `.env`에 `TOUR_API_KEY`(Decoding 키)
- **학습 포인트**: 공공 API 페이지네이션 · 재시도, 비밀 값 다루기, 저작권 정책을 지키는 수집(원본은 git 밖에)
- **계획**: [`../plan-v2.md`](../plan-v2.md) Task 1

## 프롬프트

```text
청도군 TourAPI 수집 도구를 tools/tourapi/ 에 만들어줘. 앱 코드(apps/, packages/)는 건드리지 마.

참고 문서:
#file:docs/01-product/day-course-design.md
#file:docs/01-product/data-sources-research.md

만들 것:
1. tools/tourapi/collect.mjs (의존성 없이 Node 22 내장 fetch, ESM)
   - 저장소 루트의 .env 에서 TOUR_API_KEY 를 읽는다 (dotenv 쓰지 말고 직접 파싱). 없으면 한국어 오류 후 exit 1
   - 키를 콘솔 · 파일 어디에도 출력하지 마
   - 기본 URL https://apis.data.go.kr/B551011/KorService2, 공통 파라미터 serviceKey, MobileOS=ETC, MobileApp=CheongdoCourse, _type=json
   - areaBasedList2 (lDongRegnCd=47, lDongSignguCd=820, numOfRows=300, pageNo=1, arrange=A) 로 목록 → 항목마다
     detailCommon2(contentId), detailIntro2(contentId, contentTypeId), detailInfo2(contentId, contentTypeId), detailImage2(contentId, imageYN=Y)
   - 동시 실행 3개, 호출 실패나 resultCode !== '0000' 이면 1초·2초 쉬고 최대 3회 재시도, 그래도 실패하면 오류 메시지(키 제외)와 함께 exit 1
   - items 가 빈 문자열("")이거나 item 이 객체 1개인 응답도 배열로 정규화
   - 결과: .data-draft/tourapi-cheongdo.json = { collectedAt(ISO), source: 'TourAPI KorService2', total, items: [{ list, common, intro, info, images }] } (contentid 숫자 오름차순)
   - 옵션 --limit N : 목록 앞 N개만 상세 조회하고 .data-draft/tourapi-cheongdo.sample.json 에 쓴다 (전체 초안을 덮어쓰지 않음)
   - 진행 로그: 20건마다 "N/전체 (calls M)", 끝에 "done: N items, M calls"
2. tools/tourapi/candidates.mjs
   - .data-draft/tourapi-cheongdo.json 을 읽어 .data-draft/candidates.md 를 쓴다 (API 호출 없음)
   - kind 후보: contenttypeid 12·14 → spot, 28 → 제목에 캠핑·야영·글램핑·카라반·펜션·CC 가 들어가면 제외, 아니면 spot, 39 → lclsSystm3 가 FD050100 이면 cafe 아니면 restaurant, 그 외(32 숙박, 38 쇼핑 등) 제외
   - 읍면: addr1 에서 "청도군 다음의 ○○읍/○○면", 없으면 "?" 
   - 표 열: contentId · kind · 이름 · 읍면 · 위도(mapy) · 경도(mapx) · 1유형 사진 수(firstimage 의 cpyrhtDivCd 와 images 의 cpyrhtDivCd 중 Type1 개수) · 운영시간 원문(intro 의 usetime/opentime 으로 시작하는 필드, HTML 태그 제거, 앞 60자)
   - kind 별 섹션, 섹션 안은 읍면 → 이름 순. 맨 위에 kind 별 개수 요약
3. tools/tourapi/README.md — 키 넣는 법(.env), 실행 명령 2개, 하루 호출 한도 1,000건 · 전체 수집 1회 약 530건, 결과물이 .data-draft/ 에만 생기고 커밋하지 않는 이유(한국관광콘텐츠랩 "콘텐츠 캐싱(로컬서버 저장방식) 금지"), 출처 표기 문구
4. .gitignore 에 .data-draft/ 추가, .dockerignore 에 tools 와 .data-draft 추가

제약:
- 오늘 이미 전체 수집을 해서 남은 호출이 약 460건뿐이야. collect.mjs 는 반드시 --limit 2 로만 실행해서 확인해 (전체 실행 금지)
- .data-draft/tourapi-cheongdo.json 은 이미 있으니 삭제하거나 덮어쓰지 마. candidates.mjs 는 이 파일로 실행해서 확인해
- 새 npm 의존성 추가 금지

완료 기준:
- node tools/tourapi/collect.mjs --limit 2 → "done: 2 items, 9 calls", sample 파일 생성
- node tools/tourapi/candidates.mjs → candidates.md 생성, 요약에 spot · restaurant · cafe 개수가 나옴
- git status 에 .data-draft/ 가 보이지 않음
- npm run lint, npx prettier --check . 통과 (tools 가 lint 대상에 안 들어가면 그대로 둬도 됨)

끝나면 보고: 변경 파일 목록, 실행한 명령과 결과(kind 별 개수 포함), 문서와 다르게 한 부분과 이유.
```

## 리뷰 체크리스트

- [ ] 키가 로그 · 파일 · 오류 메시지 어디에도 안 나옴
- [ ] `--limit` 결과가 전체 초안을 덮어쓰지 않음
- [ ] `items: ""` · 단일 객체 응답 정규화
- [ ] 재시도 후 실패 시 exit 1
- [ ] `.data-draft/`가 git · Docker 빌드 컨텍스트 밖
- [ ] candidates kind 분류가 설계 5장(캠핑 · 숙박 · 쇼핑 제외, 카페 = FD050100)과 일치
