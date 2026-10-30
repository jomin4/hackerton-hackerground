import {
  COMPANION_LABELS,
  TAG_LABELS,
  ZONE_LABELS,
  type Course,
  type CourseStop,
} from '@cheongdo/shared';
import { Link } from 'react-router';

import { Car, Check, Clock, MapPin } from '../ui/icons.js';
import { Chip } from '../ui/Chip.js';
import { formatClock, formatDuration } from '../../lib/format.js';

export function CourseTimeline({ course, fromQuery }: { course: Course; fromQuery: string }) {
  return (
    <section aria-labelledby="course-timeline-heading">
      <h2 className="sr-only" id="course-timeline-heading">
        방문 순서
      </h2>
      <ol className="space-y-0">
        {course.stops.map((stop, index) => {
          const nextStop = course.stops[index + 1];
          return (
            <li className="flex gap-3 sm:gap-4" key={stop.spot.id}>
              <div aria-hidden="true" className="flex w-9 shrink-0 flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-sm font-medium text-white">
                  {String(stop.order).padStart(2, '0')}
                </span>
                {nextStop && <span className="mt-2 w-px flex-1 bg-line-strong" />}
              </div>
              <div className="min-w-0 flex-1 pb-7">
                <StopCard course={course} fromQuery={fromQuery} stop={stop} />
                {nextStop && (
                  <div className="flex min-h-11 items-center gap-2 pl-1 pt-2 text-xs text-muted sm:text-sm">
                    <Car className="h-4 w-4 shrink-0" />
                    <span>
                      차로 약 {nextStop.travelMinutes}분 ·{' '}
                      {stop.spot.zone === nextStop.spot.zone
                        ? '같은 권역'
                        : `${ZONE_LABELS[stop.spot.zone]} → ${ZONE_LABELS[nextStop.spot.zone]}`}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StopCard({
  course,
  fromQuery,
  stop,
}: {
  course: Course;
  fromQuery: string;
  stop: CourseStop;
}) {
  const recommendation = [
    `관심사 ${stop.matchedTags.length}개 일치`,
    ...(stop.companionMatch ? [`${COMPANION_LABELS[course.conditions.with]} 추천`] : []),
  ].join(' · ');

  return (
    <article className="rounded-card border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Chip className="bg-fill">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            {ZONE_LABELS[stop.spot.zone]}
          </Chip>
          <h3 className="mt-3 text-lg font-semibold tracking-tight">{stop.spot.name}</h3>
        </div>
        <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 font-mono text-sm text-ink-3">
          <Clock aria-hidden="true" className="h-4 w-4" />
          {formatClock(stop.startMinute)} – {formatClock(stop.endMinute)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink-2">{stop.spot.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {stop.matchedTags.map((tag) => (
          <span
            className="inline-flex min-h-7 items-center gap-1 rounded-md bg-accent-soft px-2 text-xs font-medium text-accent-text"
            key={tag}
          >
            <Check className="h-3.5 w-3.5" />
            {TAG_LABELS[tag]}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-muted">{recommendation}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3">
        <span className="text-xs text-muted">체류 {formatDuration(stop.spot.stayMinutes)}</span>
        <Link
          className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-accent-text"
          to={`/spots/${stop.spot.id}?from=${encodeURIComponent(fromQuery)}`}
        >
          상세 보기
        </Link>
      </div>
    </article>
  );
}
