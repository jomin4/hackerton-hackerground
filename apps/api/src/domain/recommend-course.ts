import { TRAVEL_MINUTES } from '@cheongdo/shared';
import type {
  Course,
  CourseQuery,
  CourseStop,
  Spot,
  SpotSummary,
  Tag,
  Zone,
} from '@cheongdo/shared';

const TAG_MATCH_SCORE = 10;
const COMPANION_MATCH_SCORE = 5;
const MINUTES_PER_HOUR = 60;
const FIRST_STOP_TRAVEL_MINUTES = 0;
const COURSE_START_MINUTE = 0;
const NO_COMPANION_SCORE = 0;

interface Candidate {
  spot: Spot;
  matchedTags: Tag[];
  companionMatch: boolean;
  score: number;
  rank: number;
}

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function scoreCandidates(spots: Spot[], query: CourseQuery): Candidate[] {
  const excludedIds = new Set(query.exclude);

  return spots
    .filter((spot) => !excludedIds.has(spot.id))
    .map((spot): Candidate => {
      const matchedTags = query.tags.filter((tag) => spot.tags.includes(tag));
      const companionMatch = spot.goodFor.includes(query.with);
      return {
        spot,
        matchedTags,
        companionMatch,
        rank: 0,
        score:
          matchedTags.length * TAG_MATCH_SCORE +
          (companionMatch ? COMPANION_MATCH_SCORE : NO_COMPANION_SCORE),
      };
    })
    .filter((candidate) => candidate.matchedTags.length > 0);
}

function sortCandidates(candidates: Candidate[]): Candidate[] {
  return [...candidates]
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.spot.stayMinutes - right.spot.stayMinutes ||
        compareIds(left.spot.id, right.spot.id),
    )
    .map((candidate, rank) => ({ ...candidate, rank }));
}

function selectInitialCandidates(candidates: Candidate[], budgetMinutes: number): Candidate[] {
  const selected: Candidate[] = [];
  let usedMinutes = COURSE_START_MINUTE;

  for (const candidate of candidates) {
    const travelMinutes =
      selected.length === 0 ? FIRST_STOP_TRAVEL_MINUTES : TRAVEL_MINUTES.otherZone;
    const candidateTotal = usedMinutes + travelMinutes + candidate.spot.stayMinutes;
    if (candidateTotal <= budgetMinutes) {
      selected.push(candidate);
      usedMinutes = candidateTotal;
    }
  }

  return selected;
}

function getZoneOrder(candidates: Candidate[]): Zone[] {
  const zones: Zone[] = [];
  for (const { spot } of [...candidates].sort((left, right) => left.rank - right.rank)) {
    if (!zones.includes(spot.zone)) {
      zones.push(spot.zone);
    }
  }
  return zones;
}

function arrangeRoute(candidates: Candidate[]): Candidate[] {
  const zoneOrder = getZoneOrder(candidates);
  return zoneOrder.flatMap((zone) =>
    candidates
      .filter(({ spot }) => spot.zone === zone)
      .sort(
        (left, right) =>
          left.spot.routeOrder - right.spot.routeOrder || compareIds(left.spot.id, right.spot.id),
      ),
  );
}

function calculateTravelMinutes(previous: Candidate | undefined, current: Candidate): number {
  if (previous === undefined) {
    return FIRST_STOP_TRAVEL_MINUTES;
  }
  return previous.spot.zone === current.spot.zone
    ? TRAVEL_MINUTES.sameZone
    : TRAVEL_MINUTES.otherZone;
}

function calculateRouteMinutes(route: Candidate[]): number {
  let totalMinutes = COURSE_START_MINUTE;
  let previous: Candidate | undefined;

  for (const candidate of route) {
    totalMinutes += calculateTravelMinutes(previous, candidate) + candidate.spot.stayMinutes;
    previous = candidate;
  }

  return totalMinutes;
}

function refillCandidates(
  candidates: Candidate[],
  initiallySelected: Candidate[],
  budgetMinutes: number,
): Candidate[] {
  const selectedIds = new Set(initiallySelected.map(({ spot }) => spot.id));
  const selected = [...initiallySelected];

  for (const candidate of candidates) {
    if (selectedIds.has(candidate.spot.id)) {
      continue;
    }

    const trialRoute = arrangeRoute([...selected, candidate]);
    if (calculateRouteMinutes(trialRoute) <= budgetMinutes) {
      selected.push(candidate);
      selectedIds.add(candidate.spot.id);
    }
  }

  return arrangeRoute(selected);
}

function toSpotSummary(spot: Spot): SpotSummary {
  return {
    id: spot.id,
    name: spot.name,
    summary: spot.summary,
    zone: spot.zone,
    tags: [...spot.tags],
    stayMinutes: spot.stayMinutes,
  };
}

function buildCourse(
  rankedCandidates: Candidate[],
  selectedRoute: Candidate[],
  query: CourseQuery,
  budgetMinutes: number,
): Course {
  const stops: CourseStop[] = [];
  let elapsedMinutes = COURSE_START_MINUTE;
  let previous: Candidate | undefined;

  for (const candidate of selectedRoute) {
    const travelMinutes = calculateTravelMinutes(previous, candidate);
    const startMinute = elapsedMinutes + travelMinutes;
    const endMinute = startMinute + candidate.spot.stayMinutes;
    stops.push({
      order: stops.length + 1,
      spot: toSpotSummary(candidate.spot),
      travelMinutes,
      startMinute,
      endMinute,
      matchedTags: [...candidate.matchedTags],
      companionMatch: candidate.companionMatch,
      score: candidate.score,
    });
    elapsedMinutes = endMinute;
    previous = candidate;
  }

  const stayMinutes = selectedRoute.reduce((total, { spot }) => total + spot.stayMinutes, 0);
  const travelMinutes = stops.reduce((total, stop) => total + stop.travelMinutes, 0);
  const totalMinutes = stayMinutes + travelMinutes;
  const selectedIds = new Set(selectedRoute.map(({ spot }) => spot.id));
  const excluded = rankedCandidates
    .filter(({ spot }) => !selectedIds.has(spot.id))
    .map(({ spot }) => ({ spot: toSpotSummary(spot), reason: 'NOT_ENOUGH_TIME' as const }));

  return {
    conditions: {
      ...query,
      tags: [...query.tags],
      exclude: [...query.exclude],
    },
    stops,
    excluded,
    totals: {
      budgetMinutes,
      stayMinutes,
      travelMinutes,
      totalMinutes,
      slackMinutes: budgetMinutes - totalMinutes,
    },
    zones: getZoneOrder(selectedRoute),
  };
}

export function recommendCourse(spots: Spot[], query: CourseQuery): Course {
  const budgetMinutes = query.hours * MINUTES_PER_HOUR;
  const scoredCandidates = scoreCandidates(spots, query);
  const rankedCandidates = sortCandidates(scoredCandidates);
  const initiallySelected = selectInitialCandidates(rankedCandidates, budgetMinutes);
  const selectedRoute = refillCandidates(rankedCandidates, initiallySelected, budgetMinutes);
  return buildCourse(rankedCandidates, selectedRoute, query, budgetMinutes);
}
