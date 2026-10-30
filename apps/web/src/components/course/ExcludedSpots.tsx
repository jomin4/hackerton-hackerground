import { HOURS, type Course } from '@cheongdo/shared';
import { Link } from 'react-router';

import { formatDuration } from '../../lib/format.js';
import { toCourseUrl } from '../../lib/query.js';

export function ExcludedSpots({ course }: { course: Course }) {
  if (course.excluded.length === 0) return null;

  const nextHours = HOURS.find((hours) => hours > course.conditions.hours) ?? null;

  return (
    <section
      aria-labelledby="excluded-spots-heading"
      className="rounded-card border border-line bg-surface p-5"
    >
      <h2 className="text-sm font-semibold" id="excluded-spots-heading">
        시간이 부족해 빠진 장소
      </h2>
      <ul className="mt-3 divide-y divide-line-soft">
        {course.excluded.map(({ spot }) => (
          <li
            className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm"
            key={spot.id}
          >
            <span>{spot.name}</span>
            <span className="shrink-0 text-xs text-muted">{formatDuration(spot.stayMinutes)}</span>
          </li>
        ))}
      </ul>
      {nextHours !== null && (
        <Link
          className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-accent-text underline underline-offset-4"
          to={toCourseUrl({ ...course.conditions, hours: nextHours })}
        >
          {nextHours}시간 코스로 다시 만들기
        </Link>
      )}
    </section>
  );
}
