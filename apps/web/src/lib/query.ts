import { COMPANIONS, HOURS, TAGS, type CourseQuery, type Tag } from '@cheongdo/shared';

export const DEFAULT_COURSE_QUERY: CourseQuery = {
  hours: 4,
  with: 'family',
  tags: ['nature', 'experience'],
  exclude: [],
};

export function sortTags(tags: readonly Tag[]): Tag[] {
  return TAGS.filter((tag) => tags.includes(tag));
}

export function fromCourseSearchParams(params: URLSearchParams): CourseQuery {
  const rawHours = Number(params.get('hours'));
  const hours = HOURS.find((value) => value === rawHours) ?? DEFAULT_COURSE_QUERY.hours;
  const rawCompanion = params.get('with');
  const companion = COMPANIONS.find((value) => value === rawCompanion);
  const tags = sortTags(
    (params.get('tags') ?? '')
      .split(',')
      .filter((value): value is Tag => TAGS.some((tag) => tag === value)),
  );

  return {
    hours,
    with: companion ?? DEFAULT_COURSE_QUERY.with,
    tags: params.has('tags') ? tags : [...DEFAULT_COURSE_QUERY.tags],
    exclude: [],
  };
}

export function toCourseUrl(query: CourseQuery): string {
  const params = new URLSearchParams();
  params.set('hours', String(query.hours));
  params.set('with', query.with);
  return `/course?${params.toString()}&tags=${sortTags(query.tags).join(',')}`;
}
