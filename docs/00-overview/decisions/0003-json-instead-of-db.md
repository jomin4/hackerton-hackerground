# ADR 0003 — 데이터 저장: DB 대신 JSON 파일 + 메모리 로드

- 상태: 채택 (2026-10-30)

## 맥락

MVP 데이터는 관광지 10~15곳이고, 사용자가 데이터를 쓰는 기능(리뷰, 로그인)이 없다. 읽기 전용 데이터에 DB를 두면 서버 · 백업 · 연결 관리가 추가된다.

## 결정

- 관광지 데이터는 `apps/api/data/spots.json`에 둔다.
- API 서버가 **시작할 때 한 번** 읽고, zod 스키마로 검증한 뒤 메모리에 보관한다.
- 검증에 실패하면 서버를 시작하지 않는다(잘못된 데이터로 운영하지 않기).
- 데이터 접근은 `SpotRepository` 인터페이스 뒤에 숨긴다.

```ts
interface SpotRepository {
  findAll(): Spot[];
  findById(id: string): Spot | undefined;
}
```

## 근거

- 운영 요소가 줄어 배포 학습(VM · nginx · CI/CD)에 집중할 수 있다.
- 데이터 변경이 Git 이력으로 남고, PR로 검토할 수 있다.
- 응답이 메모리에서 나와 빠르다.

## 대가

- 데이터를 바꾸려면 재배포가 필요하다 (MVP에서는 수용).
- 사용자 작성 데이터(리뷰 등)를 추가하려면 DB 도입이 필요하다.

## 이후 확장

리뷰 · 사진 업로드 기능을 넣을 때 `SpotRepository` 구현을 DB 버전(PostgreSQL 컨테이너 또는 Azure Database for PostgreSQL)으로 교체한다. 라우트 코드는 바꾸지 않는다.
