import { useState } from 'react';
import { Link } from 'react-router';

import { Menu } from '../ui/icons.js';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-10 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-[1248px] items-center justify-between px-4 md:h-16 md:px-6">
        <Link
          aria-label="청도 코스 홈"
          className="inline-flex min-h-11 items-center gap-2.5"
          to="/"
        >
          <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="var(--color-accent)" />
            <path
              d="M12 5.5c1.7 2.2 2.1 3.8 1.1 5.1-.7.9-2.1 1.5-2.1 2.8 0 1.1.9 1.8 2 1.8s2-.7 2-1.8c0-1.3-1.2-2.1-1.6-3.1-.5-1.3.1-2.7 2-4.5"
              fill="var(--color-ink)"
            />
          </svg>
          <span className="text-base font-semibold tracking-tight">청도 코스</span>
        </Link>

        <nav
          aria-label="주요 메뉴"
          className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-full flex-col gap-1 border-b border-line bg-surface p-4 md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0`}
        >
          <a
            className="flex min-h-11 items-center px-2 text-sm text-ink-3 hover:text-ink md:min-h-0 md:p-0"
            href="/#how"
            onClick={() => setMenuOpen(false)}
          >
            이용 방법
          </a>
          <a
            className="flex min-h-11 items-center px-2 text-sm text-ink-3 hover:text-ink md:min-h-0 md:p-0"
            href="/#spots"
            onClick={() => setMenuOpen(false)}
          >
            관광지
          </a>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-2"
            onClick={() => setMenuOpen(false)}
            to="/#conditions"
          >
            코스 만들기
          </Link>
        </nav>

        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Menu />
        </button>
      </div>
    </header>
  );
}
