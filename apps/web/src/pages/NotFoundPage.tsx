import { Container } from '../components/ui/Container.js';
import { NotFoundState } from '../components/ui/NotFoundState.js';

export function NotFoundPage() {
  return (
    <Container>
      <NotFoundState
        description="주소를 다시 확인하거나 홈에서 원하는 화면으로 이동해 보세요."
        title="페이지를 찾을 수 없어요"
      />
    </Container>
  );
}
