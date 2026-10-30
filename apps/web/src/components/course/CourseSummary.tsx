import { ZONE_LABELS, type Course } from '@cheongdo/shared';

import { formatDuration } from '../../lib/format.js';

export function CourseSummary({ course }: { course: Course }) {
  const { budgetMinutes, stayMinutes, travelMinutes, slackMinutes, totalMinutes } = course.totals;
  const barWidth = (minutes: number) =>
    budgetMinutes > 0 ? `${(minutes / budgetMinutes) * 100}%` : '0%';

  return (
    <section
      aria-labelledby="course-summary-heading"
      className="rounded-card border border-line bg-surface p-5"
    >
      <h2 className="text-sm font-semibold" id="course-summary-heading">
        코스 요약
      </h2>
      <p className="mt-4 font-mono text-3xl font-semibold tracking-tight">
        {formatDuration(totalMinutes)}
      </p>
      <p className="mt-1 text-sm text-muted">예산 {formatDuration(budgetMinutes)}</p>

      <div
        aria-label={`체류 ${formatDuration(stayMinutes)}, 이동 ${formatDuration(travelMinutes)}, 여유 ${formatDuration(slackMinutes)}`}
        className="mt-6 flex h-3 overflow-hidden rounded-full bg-fill"
        role="img"
      >
        <div className="h-full bg-ink" style={{ width: barWidth(stayMinutes) }} />
        <div className="h-full bg-accent" style={{ width: barWidth(travelMinutes) }} />
        <div className="h-full bg-line-strong" style={{ width: barWidth(slackMinutes) }} />
      </div>
      <ul className="mt-4 grid gap-2 text-xs text-ink-3">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-ink" />
          체류 {formatDuration(stayMinutes)}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-accent" />
          이동 {formatDuration(travelMinutes)}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-line-strong" />
          여유 {formatDuration(slackMinutes)}
        </li>
      </ul>

      <div className="mt-6 border-t border-line-soft pt-4 text-sm">
        <p>
          장소 <span className="font-medium">{course.stops.length}곳</span>
        </p>
        <p className="mt-2 text-muted">
          권역 {course.zones.map((zone) => ZONE_LABELS[zone]).join(' · ')}
        </p>
      </div>
    </section>
  );
}
