import { Route, Routes } from 'react-router';

import { SiteFooter } from './components/layout/SiteFooter.js';
import { SiteHeader } from './components/layout/SiteHeader.js';
import { CoursePage } from './pages/CoursePage.js';
import { HomePage } from './pages/HomePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { SpotPage } from './pages/SpotPage.js';

export function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/spots/:id" element={<SpotPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}
