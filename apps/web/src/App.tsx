import { Link, Route, Routes } from 'react-router';

import { SiteFooter } from './components/layout/SiteFooter.js';
import { SiteHeader } from './components/layout/SiteHeader.js';
import { Container } from './components/ui/Container.js';
import { CoursePage } from './pages/CoursePage.js';
import { HomePage } from './pages/HomePage.js';
import { SpotPage } from './pages/SpotPage.js';

function ComingSoonPage() {
  return (
    <Container className="py-24 text-center">
      <p className="font-mono text-xs tracking-[0.06em] text-accent-text">COMING SOON</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">준비 중이에요</h1>
      <Link
        className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-medium text-white"
        to="/"
      >
        홈으로 돌아가기
      </Link>
    </Container>
  );
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/spots/:id" element={<SpotPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}
