import type { Spot, SpotSummary } from '@cheongdo/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SpotPage } from './SpotPage.js';

vi.mock('../lib/api.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api.js')>();
  return { ...actual, fetchJson: vi.fn() };
});

import { fetchJson } from '../lib/api.js';

const spotBase: Spot = {
  id: 'rail-bike',
  name: '청도 레일바이크',
  summary: '레일 위를 달리며 청도의 풍경을 즐기는 체험 공간이에요.',
  description: ['철길을 따라 주변 풍경을 감상하는 곳이에요.'],
  tips: [],
  zone: 'cheongdo-eup',
  routeOrder: 1,
  tags: ['experience', 'nature'],
  goodFor: ['family'],
  stayMinutes: 60,
  address: '경상북도 청도군 청도읍',
  source: '확인 전 임시 정보',
};

function renderSpot(spot: Spot, nearby: SpotSummary[] = []) {
  vi.mocked(fetchJson).mockResolvedValue({ spot, nearby });
  return render(
    <MemoryRouter initialEntries={[`/spots/${spot.id}`]}>
      <Routes>
        <Route element={<SpotPage />} path="/spots/:id" />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('SpotPage', () => {
  it('shows visit-before-check values when operating hours and fee are missing', async () => {
    renderSpot(spotBase);

    const information = await screen.findByRole('region', { name: '이용 정보' });
    expect(within(information).getByText('평일 · 방문 전 확인')).toBeTruthy();
    expect(within(information).getByText('주말 · 방문 전 확인')).toBeTruthy();
    expect(within(information).getByText('입장료').nextElementSibling?.textContent).toBe(
      '방문 전 확인',
    );
  });

  it('hides the tips section when there are no tips', async () => {
    renderSpot(spotBase);

    await screen.findByRole('heading', { name: '청도 레일바이크' });
    expect(screen.queryByRole('heading', { name: '방문 팁' })).toBeNull();
  });

  it('shows the source without a checked-at date when checkedAt is absent', async () => {
    renderSpot(spotBase);

    expect(
      await screen.findByText('출처: 확인 전 임시 정보. 운영 정보는 방문 전 확인하세요.'),
    ).toBeTruthy();
  });

  it('renders verified wine tunnel operating details and the checked date', async () => {
    const wineTunnel: Spot = {
      ...spotBase,
      id: 'wine-tunnel',
      name: '청도 와인터널',
      hours: {
        weekday: '09:30-18:00',
        weekend: '09:30-19:00',
        note: '마감 15분 전까지 퇴장',
      },
      closed: '연중무휴',
      fee: '관람 무료 · 시음 별도',
      phone: '054-371-1904',
      source: '한국관광공사',
      checkedAt: '2026-08-18',
    };
    renderSpot(wineTunnel);

    const information = await screen.findByRole('region', { name: '이용 정보' });
    expect(within(information).getByText('평일 · 09:30-18:00')).toBeTruthy();
    expect(within(information).getByText('주말 · 09:30-19:00')).toBeTruthy();
    expect(within(information).getByText('054-371-1904')).toBeTruthy();
    expect(
      within(information).getByText('출처: 한국관광공사 · 2026-08-18 기준. 방문 전 확인하세요.'),
    ).toBeTruthy();
  });
});
