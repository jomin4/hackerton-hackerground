export const TAGS = ['nature', 'history', 'experience', 'food', 'photo'] as const;
export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  nature: '자연',
  history: '역사·문화',
  experience: '체험',
  food: '먹거리',
  photo: '사진 명소',
};

export const COMPANIONS = ['solo', 'couple', 'family', 'friends'] as const;
export type Companion = (typeof COMPANIONS)[number];

export const COMPANION_LABELS: Record<Companion, string> = {
  solo: '혼자',
  couple: '커플',
  family: '가족',
  friends: '친구',
};

export const HOURS = [2, 4, 6] as const;
export type Hours = (typeof HOURS)[number];

export const ZONES = ['cheongdo-eup', 'hwayang-eup', 'unmun-myeon', 'iseo-myeon'] as const;
export type Zone = (typeof ZONES)[number];

export const ZONE_LABELS: Record<Zone, string> = {
  'cheongdo-eup': '청도읍',
  'hwayang-eup': '화양읍',
  'unmun-myeon': '운문면',
  'iseo-myeon': '이서면',
};

export const TRAVEL_MINUTES = { sameZone: 10, otherZone: 25 } as const;

export const UNVERIFIED_SOURCE = '확인 전 임시 정보';
