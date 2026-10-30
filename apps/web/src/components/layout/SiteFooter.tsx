import { Container } from '../ui/Container.js';

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-3 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>운영 정보는 방문 전 공식 안내를 확인해 주세요.</p>
        <p className="font-mono">© 2026 청도 코스</p>
      </Container>
    </footer>
  );
}
