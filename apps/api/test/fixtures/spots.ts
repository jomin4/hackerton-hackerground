import type { Companion, Spot, Tag, Zone } from '@cheongdo/shared';

function createSpot(
  id: string,
  zone: Zone,
  routeOrder: number,
  tags: Tag[],
  goodFor: Companion[],
  stayMinutes: number,
): Spot {
  return {
    id,
    name: id,
    summary: `${id} summary`,
    description: [`${id} description`],
    tips: [],
    zone,
    routeOrder,
    tags,
    goodFor,
    stayMinutes,
    address: '경상북도 청도군',
    source: '확인 전 임시 정보',
  };
}

export const spots: Spot[] = [
  createSpot(
    'rail-bike',
    'cheongdo-eup',
    1,
    ['experience', 'nature'],
    ['couple', 'family', 'friends'],
    60,
  ),
  createSpot(
    'yudeung-yeonji',
    'hwayang-eup',
    1,
    ['nature', 'photo'],
    ['solo', 'couple', 'family'],
    30,
  ),
  createSpot(
    'wine-tunnel',
    'hwayang-eup',
    2,
    ['experience', 'food', 'photo'],
    ['couple', 'family', 'friends'],
    40,
  ),
  createSpot(
    'eupseong',
    'hwayang-eup',
    3,
    ['history', 'nature', 'photo'],
    ['solo', 'couple', 'family'],
    40,
  ),
  createSpot(
    'provence',
    'hwayang-eup',
    4,
    ['photo', 'experience'],
    ['couple', 'family', 'friends'],
    100,
  ),
  createSpot('unmunsa', 'unmun-myeon', 1, ['history', 'nature'], ['solo', 'couple', 'family'], 80),
];
