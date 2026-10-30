import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import { spotsFileSchema, UNVERIFIED_SOURCE } from '@cheongdo/shared';

describe('data/spots.json', () => {
  it('satisfies the shared spot schema', () => {
    const contents = readFileSync(new URL('../../data/spots.json', import.meta.url), 'utf8');
    const spots = spotsFileSchema.parse(JSON.parse(contents));

    expect(spots).toHaveLength(6);
  });

  it('keeps the verified wine tunnel data exactly as specified', () => {
    const contents = readFileSync(new URL('../../data/spots.json', import.meta.url), 'utf8');
    const spots = spotsFileSchema.parse(JSON.parse(contents));
    const wineTunnel = spots.find((spot) => spot.id === 'wine-tunnel');

    expect(wineTunnel).toEqual({
      id: 'wine-tunnel',
      name: '청도 와인터널',
      summary: '옛 철도 터널을 와인 저장고로 바꾼 곳. 청도 반시로 만든 감와인을 시음할 수 있어요.',
      description: [
        '대한제국 말기 경부선 철도를 놓으며 뚫었던 옛 터널을 와인 저장고로 바꾼 곳이에요. 벽돌과 돌로 쌓은 아치형 터널이 약 1km 이어지고, 안쪽은 1년 내내 서늘해 와인을 숙성하기에 알맞아요.',
        '청도 특산물인 반시로 만든 감와인을 시음하고 구매할 수 있고, 조명이 켜진 터널 내부는 사진 명소로도 알려져 있어요.',
      ],
      tips: [
        '터널 안은 연중 서늘해요. 여름에도 얇은 겉옷을 챙기면 좋아요.',
        '주말과 연휴에는 입구 주변 도로가 붐빌 수 있어요. 이른 시간 방문을 추천해요.',
        '청도 프로방스, 청도읍성과 같은 화양읍 권역이라 한 코스로 묶기 좋아요.',
      ],
      zone: 'hwayang-eup',
      routeOrder: 2,
      tags: ['experience', 'food', 'photo'],
      goodFor: ['couple', 'family', 'friends'],
      stayMinutes: 40,
      address: '경상북도 청도군 화양읍 송금길 100',
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
    });
  });

  it('keeps the other five spots marked as unverified without operating details', () => {
    const contents = readFileSync(new URL('../../data/spots.json', import.meta.url), 'utf8');
    const spots = spotsFileSchema.parse(JSON.parse(contents));
    const otherSpots = spots.filter((spot) => spot.id !== 'wine-tunnel');

    expect(otherSpots).toHaveLength(5);
    for (const spot of otherSpots) {
      expect(spot.source).toBe(UNVERIFIED_SOURCE);
      expect(spot).not.toHaveProperty('checkedAt');
      expect(spot).not.toHaveProperty('hours');
      expect(spot).not.toHaveProperty('closed');
      expect(spot).not.toHaveProperty('fee');
      expect(spot).not.toHaveProperty('phone');
    }
  });
});
