import type { Companion, Hours, Tag, Zone } from './constants.js';

export interface OpeningHours {
  weekday?: string;
  weekend?: string;
  note?: string;
}

export interface Spot {
  id: string;
  name: string;
  summary: string;
  description: string[];
  tips: string[];
  zone: Zone;
  routeOrder: number;
  tags: Tag[];
  goodFor: Companion[];
  stayMinutes: number;
  address: string;
  hours?: OpeningHours;
  closed?: string;
  fee?: string;
  phone?: string;
  source: string;
  checkedAt?: string;
}

export type SpotSummary = Pick<Spot, 'id' | 'name' | 'summary' | 'zone' | 'tags' | 'stayMinutes'>;

export interface CourseQuery {
  hours: Hours;
  with: Companion;
  tags: Tag[];
  exclude: string[];
}

export interface CourseStop {
  order: number;
  spot: SpotSummary;
  travelMinutes: number;
  startMinute: number;
  endMinute: number;
  matchedTags: Tag[];
  companionMatch: boolean;
  score: number;
}

export interface ExcludedSpot {
  spot: SpotSummary;
  reason: 'NOT_ENOUGH_TIME';
}

export interface CourseTotals {
  budgetMinutes: number;
  stayMinutes: number;
  travelMinutes: number;
  totalMinutes: number;
  slackMinutes: number;
}

export interface Course {
  conditions: CourseQuery;
  stops: CourseStop[];
  excluded: ExcludedSpot[];
  totals: CourseTotals;
  zones: Zone[];
}
