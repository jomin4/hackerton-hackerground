import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from './HomePage.js';

vi.mock('../lib/api.js', () => ({
  fetchJson: vi.fn().mockResolvedValue({ items: [] }),
}));

function renderHome(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<p>코스 결과</p>} path="/course" />
      </Routes>
      <LocationOutput />
    </MemoryRouter>,
  );
}

function LocationOutput() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('HomePage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables course creation when every interest is cleared', () => {
    renderHome();

    for (const label of ['자연', '역사·문화', '체험', '먹거리', '사진 명소']) {
      const button = screen.getByRole('button', { name: label });
      if (button.getAttribute('aria-pressed') === 'true') fireEvent.click(button);
    }

    const conditions = screen.getByRole('region', { name: '여행 조건을 골라주세요' });
    expect(
      within(conditions).getByRole('button', { name: '코스 만들기' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(screen.getByText('관심사를 하나 이상 골라주세요')).toBeTruthy();
  });

  it('updates the shared URL preview as interests change', () => {
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: '자연' }));

    expect(screen.getByText('/course?hours=4&with=family&tags=experience')).toBeTruthy();
  });

  it('prefills conditions from URL parameters', () => {
    renderHome('/?hours=6&with=solo&tags=photo,nature');

    expect(screen.getByRole('button', { name: /6시간/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '혼자' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('/course?hours=6&with=solo&tags=nature,photo')).toBeTruthy();
  });

  it('navigates to the selected course URL', () => {
    renderHome();

    const conditions = screen.getByRole('region', { name: '여행 조건을 골라주세요' });
    fireEvent.click(within(conditions).getByRole('button', { name: '코스 만들기' }));

    expect(screen.getByTestId('location').textContent).toBe(
      '/course?hours=4&with=family&tags=nature,experience',
    );
  });
});
