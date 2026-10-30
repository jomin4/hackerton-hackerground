import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CoursePage } from './CoursePage.js';

const t1Course = {
  conditions: {
    hours: 4,
    with: 'family',
    tags: ['nature', 'experience'],
    exclude: [],
  },
  stops: [
    {
      order: 1,
      spot: {
        id: 'rail-bike',
        name: '청도 레일바이크',
        summary: '레일 위를 달리며 청도의 풍경을 즐기는 체험 공간이에요.',
        zone: 'cheongdo-eup',
        tags: ['experience', 'nature'],
        stayMinutes: 60,
      },
      travelMinutes: 0,
      startMinute: 0,
      endMinute: 60,
      matchedTags: ['nature', 'experience'],
      companionMatch: true,
      score: 25,
    },
    {
      order: 2,
      spot: {
        id: 'yudeung-yeonji',
        name: '유등연지',
        summary: '물가와 자연 풍경을 천천히 감상할 수 있는 장소예요.',
        zone: 'hwayang-eup',
        tags: ['nature', 'photo'],
        stayMinutes: 30,
      },
      travelMinutes: 25,
      startMinute: 85,
      endMinute: 115,
      matchedTags: ['nature'],
      companionMatch: true,
      score: 15,
    },
    {
      order: 3,
      spot: {
        id: 'wine-tunnel',
        name: '청도 와인터널',
        summary: '옛 철도 터널을 와인 저장고로 바꾼 곳이에요.',
        zone: 'hwayang-eup',
        tags: ['experience', 'food', 'photo'],
        stayMinutes: 40,
      },
      travelMinutes: 10,
      startMinute: 125,
      endMinute: 165,
      matchedTags: ['experience'],
      companionMatch: true,
      score: 15,
    },
    {
      order: 4,
      spot: {
        id: 'eupseong',
        name: '청도읍성',
        summary: '성곽을 따라 역사와 주변 풍경을 살펴볼 수 있어요.',
        zone: 'hwayang-eup',
        tags: ['history', 'nature', 'photo'],
        stayMinutes: 40,
      },
      travelMinutes: 10,
      startMinute: 175,
      endMinute: 215,
      matchedTags: ['nature'],
      companionMatch: true,
      score: 15,
    },
  ],
  excluded: [],
  totals: {
    budgetMinutes: 240,
    stayMinutes: 170,
    travelMinutes: 45,
    totalMinutes: 215,
    slackMinutes: 25,
  },
  zones: ['cheongdo-eup', 'hwayang-eup'],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CoursePage', () => {
  it('renders T1 stops in order and displays the total duration', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(t1Course), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/course?hours=4&with=family&tags=nature,experience']}>
        <Routes>
          <Route element={<CoursePage />} path="/course" />
        </Routes>
      </MemoryRouter>,
    );

    const timeline = await screen.findByRole('region', { name: '방문 순서' });
    const orderedList = within(timeline).getByRole('list');
    const names = ['청도 레일바이크', '유등연지', '청도 와인터널', '청도읍성'];
    const renderedNames = within(orderedList)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);

    const secondStop = within(orderedList).getAllByRole('listitem')[1];
    if (!secondStop) throw new Error('T1 requires at least two stops.');

    expect(renderedNames).toEqual(names);
    expect(await screen.findByText('3시간 35분')).toBeTruthy();
    expect(await screen.findByText('차로 약 25분 · 청도읍 → 화양읍')).toBeTruthy();
    expect(within(secondStop).getByText('차로 약 10분 · 같은 권역')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/course?hours=4&with=family&tags=nature,experience',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('creates the next-hours URL with unescaped comma-separated tags', async () => {
    const excludedSpot = t1Course.stops[0]?.spot;
    if (!excludedSpot) throw new Error('T1 requires at least one stop.');

    const course = {
      ...t1Course,
      conditions: {
        hours: 2,
        with: 'solo',
        tags: ['nature', 'history'],
        exclude: [],
      },
      excluded: [{ spot: excludedSpot, reason: 'NOT_ENOUGH_TIME' }],
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(course), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/course?hours=2&with=solo&tags=nature,history']}>
        <Routes>
          <Route element={<CoursePage />} path="/course" />
        </Routes>
      </MemoryRouter>,
    );

    const rebuildLink = await screen.findByRole('link', { name: '4시간 코스로 다시 만들기' });
    expect(rebuildLink.getAttribute('href')).toBe('/course?hours=4&with=solo&tags=nature,history');
  });
});
