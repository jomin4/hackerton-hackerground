# 청도군 TourAPI 수집 도구

Node.js 22 이상이 필요하며 추가 npm 패키지는 사용하지 않아요.

## API 키 설정

저장소 루트의 `.env`에 발급받은 디코딩 키를 추가해요. `.env`는 Git에서 제외돼요.

```dotenv
TOUR_API_KEY=발급받은_디코딩_키
```

수집 스크립트는 키를 로그나 결과 파일에 기록하지 않아요.

## 실행

저장소 루트에서 다음 명령을 실행해요.

```sh
node tools/tourapi/collect.mjs
node tools/tourapi/candidates.mjs
```

첫 명령은 청도군 목록과 상세 정보를 수집해 `.data-draft/tourapi-cheongdo.json`에 저장해요. `node tools/tourapi/collect.mjs --limit 2`처럼 `--limit N`을 지정하면 앞의 N건만 수집해 `.data-draft/tourapi-cheongdo.sample.json`에 저장하고 전체 초안은 덮어쓰지 않아요. 둘째 명령은 기존 전체 초안에서 `.data-draft/candidates.md` 후보표를 생성하며 API를 호출하지 않아요.

하루 호출 한도는 1,000건이고, 전체 133건 기준 수집은 목록 호출 1회와 장소별 상세 호출 4회로 약 533건이에요. 실패한 요청은 최대 3회까지 재시도해요.

## 초안 데이터와 출처

결과는 `.data-draft/` 아래에만 저장하고 Git에 커밋하지 않아요. 한국관광콘텐츠랩 저작권 정책의 **“콘텐츠 캐싱(로컬서버 저장방식) 금지”**를 준수하기 위해 원본 응답은 조사용 로컬 초안으로만 두고 서비스 데이터에 포함하지 않아요. 장소 정보와 사진은 공식 출처로 별도 확인하고 큐레이션해요.

출처 표기 문구: **데이터 제공: ⓒ한국관광공사**
