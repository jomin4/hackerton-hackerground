import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { TAG_LABELS, TRAVEL_MINUTES, ZONE_LABELS } from '@cheongdo/shared';

import { Button } from '../components/ui/Button.js';
import { Chip } from '../components/ui/Chip.js';
import { Container } from '../components/ui/Container.js';
import { NotFoundState } from '../components/ui/NotFoundState.js';
import { Tag } from '../components/ui/Tag.js';
import { Check, Copy, MapPin } from '../components/ui/icons.js';
import { useCourse, type CourseState } from '../hooks/useCourse.js';
import { useSpot } from '../hooks/useSpot.js';
import { ApiError } from '../lib/api.js';
import { formatDuration } from '../lib/format.js';
import { fromCourseSearchParams, toCourseUrl } from '../lib/query.js';

export function SpotPage() {
  const location = useLocation();
  const state = useSpot();
  const fromQuery = new URLSearchParams(location.search).get('from');
  const hasCourse = fromQuery !== null;
  const courseState = useCourse(hasCourse ? `?${fromQuery}` : '', hasCourse);
  const courseUrl = hasCourse
    ? toCourseUrl(fromCourseSearchParams(new URLSearchParams(fromQuery)))
    : '/';
  const courseStop =
    state.status === 'success' && courseState.status === 'success'
      ? courseState.data.stops.find((stop) => stop.spot.id === state.data.spot.id)
      : undefined;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.status === 'success') {
      document.title = `${state.data.spot.name} — 청도 코스`;
    }
  }, [state]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyAddress(address: string) {
    setCopied(false);
    setCopyFailed(false);
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);

    try {
      if (!navigator.clipboard?.writeText) throw new Error('클립보드를 사용할 수 없어요.');
      await navigator.clipboard.writeText(address);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  if (
    state.status === 'error' &&
    state.error instanceof ApiError &&
    state.error.code === 'SPOT_NOT_FOUND'
  ) {
    return (
      <Container>
        <NotFoundState
          description="주소가 바뀌었거나 목록에서 빠진 장소예요. 관광지 목록에서 다른 장소를 찾아보세요."
          title="찾는 장소가 없어요"
        />
      </Container>
    );
  }

  return (
    <>
      <Container className="py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="현재 위치" className="flex flex-wrap items-center text-xs text-muted">
            <Link className="inline-flex min-h-11 items-center hover:text-ink" to="/">
              홈
            </Link>
            {hasCourse && (
              <>
                <span aria-hidden="true" className="mx-2">
                  /
                </span>
                <Link className="inline-flex min-h-11 items-center hover:text-ink" to={courseUrl}>
                  추천 코스
                </Link>
              </>
            )}
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-3">
              {state.status === 'success' ? state.data.spot.name : '관광지 상세'}
            </span>
          </nav>
          <Link
            className="inline-flex min-h-11 items-center rounded-lg border border-line-strong px-4 text-sm font-medium hover:bg-surface-2"
            to={courseUrl}
          >
            코스로 돌아가기
          </Link>
        </div>
      </Container>

      {state.status === 'loading' ? (
        <Container>
          <p className="py-16 text-center text-sm text-muted" role="status">
            관광지 정보를 불러오고 있어요
          </p>
        </Container>
      ) : state.status === 'error' ? (
        <Container>
          <SpotError error={state.error} />
        </Container>
      ) : (
        <>
          <Container>
            <div className="relative h-[220px] overflow-hidden rounded-card bg-ink text-white sm:h-[360px]">
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full text-white"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 1200 360"
              >
                <path
                  d="M170 360V242a430 430 0 0 1 860 0v118"
                  opacity=".16"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M255 360V252a345 345 0 0 1 690 0v108"
                  opacity=".22"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M345 360V263a255 255 0 0 1 510 0v97"
                  opacity=".3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M435 360V275a165 165 0 0 1 330 0v85"
                  opacity=".4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M520 360V290a80 80 0 0 1 160 0v70"
                  opacity=".55"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              {courseStop && (
                <span className="absolute left-5 top-5 inline-flex min-h-11 items-center rounded-full border border-white/30 bg-ink px-4 text-xs font-medium text-white sm:left-7 sm:top-7">
                  코스 {courseStop.order}번째 장소
                </span>
              )}
            </div>
          </Container>

          <Container className="py-8 sm:py-10">
            <section aria-labelledby="spot-title">
              <div className="flex flex-wrap gap-2">
                <Chip className="bg-accent-soft text-accent-text">
                  {ZONE_LABELS[state.data.spot.zone]}
                </Chip>
                {state.data.spot.tags.map((tag) => (
                  <Tag key={tag}>{TAG_LABELS[tag]}</Tag>
                ))}
              </div>
              <h1
                className="mt-4 text-[clamp(32px,4vw,48px)] leading-tight font-bold tracking-[-0.035em]"
                id="spot-title"
              >
                {state.data.spot.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-2">
                {state.data.spot.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  className="px-4"
                  onClick={() => void copyAddress(state.data.spot.address)}
                  type="button"
                  variant="secondary"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span aria-live="polite">{copied ? '복사됨' : '주소 복사'}</span>
                </Button>
                <a
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium hover:bg-surface-2"
                  href={`https://map.naver.com/p/search/${encodeURIComponent(state.data.spot.name)}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <MapPin className="h-4 w-4" />
                  지도에서 보기
                </a>
              </div>
              {copyFailed && (
                <p className="mt-2 text-xs text-muted" role="status">
                  주소를 복사하지 못했어요. 주소를 직접 선택해 주세요.
                </p>
              )}
            </section>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
              <div className="min-w-0 space-y-10">
                <section aria-labelledby="spot-intro-heading">
                  <h2 className="text-xl font-semibold tracking-tight" id="spot-intro-heading">
                    소개
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-7 text-ink-2">
                    {state.data.spot.description.map((paragraph, index) => (
                      <p key={`${index}-${paragraph}`}>{paragraph}</p>
                    ))}
                  </div>
                </section>

                {state.data.spot.tips.length > 0 && (
                  <section aria-labelledby="spot-tips-heading">
                    <h2 className="text-xl font-semibold tracking-tight" id="spot-tips-heading">
                      방문 팁
                    </h2>
                    <ol className="mt-4 space-y-3">
                      {state.data.spot.tips.map((tip, index) => (
                        <li className="flex gap-3 text-[15px] leading-7 text-ink-2" key={tip}>
                          <span
                            aria-hidden="true"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill font-mono text-xs text-ink-3"
                          >
                            {index + 1}
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {state.data.nearby.length > 0 && (
                  <section aria-labelledby="nearby-heading">
                    <h2 className="text-xl font-semibold tracking-tight" id="nearby-heading">
                      같은 권역의 장소
                    </h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {state.data.nearby.map((nearby) => (
                        <Link
                          className="min-h-11 rounded-card border border-line p-4 hover:bg-surface-2"
                          key={nearby.id}
                          to={`/spots/${nearby.id}${hasCourse ? `?from=${encodeURIComponent(fromQuery)}` : ''}`}
                        >
                          <span className="text-xs text-muted">{ZONE_LABELS[nearby.zone]}</span>
                          <span className="mt-1 block text-base font-semibold">{nearby.name}</span>
                          <span className="mt-2 block text-sm leading-6 text-ink-2">
                            {nearby.summary}
                          </span>
                          <span className="mt-3 block text-xs text-muted">
                            차로 약 {TRAVEL_MINUTES.sameZone}분 · 체류{' '}
                            {formatDuration(nearby.stayMinutes)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-4">
                <section
                  aria-labelledby="spot-info-heading"
                  className="rounded-card border border-line bg-surface p-5"
                >
                  <h2 className="text-lg font-semibold" id="spot-info-heading">
                    이용 정보
                  </h2>
                  <dl className="mt-4 divide-y divide-line-soft">
                    <InfoRow label="주소">
                      <p>{state.data.spot.address}</p>
                    </InfoRow>
                    <InfoRow label="운영시간">
                      <p>평일 · {state.data.spot.hours?.weekday ?? '방문 전 확인'}</p>
                      <p>주말 · {state.data.spot.hours?.weekend ?? '방문 전 확인'}</p>
                      <p>안내 · {state.data.spot.hours?.note ?? '방문 전 확인'}</p>
                    </InfoRow>
                    <InfoRow label="휴무일">{state.data.spot.closed ?? '방문 전 확인'}</InfoRow>
                    <InfoRow label="입장료">{state.data.spot.fee ?? '방문 전 확인'}</InfoRow>
                    <InfoRow label="권장 체류">
                      {formatDuration(state.data.spot.stayMinutes)}
                    </InfoRow>
                    <InfoRow label="문의">{state.data.spot.phone ?? '방문 전 확인'}</InfoRow>
                  </dl>
                  <p className="mt-4 text-xs leading-5 text-muted">
                    {state.data.spot.checkedAt
                      ? `출처: ${state.data.spot.source} · ${state.data.spot.checkedAt} 기준. 방문 전 확인하세요.`
                      : `출처: ${state.data.spot.source}. 운영 정보는 방문 전 확인하세요.`}
                  </p>
                </section>
                {hasCourse && (
                  <CourseContext
                    courseState={courseState}
                    courseSearch={`?${fromQuery}`}
                    courseUrl={courseUrl}
                    spotId={state.data.spot.id}
                  />
                )}
              </aside>
            </div>
          </Container>
        </>
      )}
    </>
  );
}

function InfoRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 space-y-1 text-sm leading-6 text-ink-2">{children}</dd>
    </div>
  );
}

function CourseContext({
  courseState,
  courseSearch,
  courseUrl,
  spotId,
}: {
  courseState: CourseState;
  courseSearch: string;
  courseUrl: string;
  spotId: string;
}) {
  const state = courseState;

  if (state.status === 'loading') {
    return (
      <section
        aria-labelledby="spot-course-heading"
        className="rounded-card border border-line p-5"
      >
        <h2 className="text-lg font-semibold" id="spot-course-heading">
          이 코스에서
        </h2>
        <p className="mt-3 text-sm text-muted" role="status">
          코스 정보를 불러오고 있어요
        </p>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section
        aria-labelledby="spot-course-heading"
        className="rounded-card border border-line p-5"
      >
        <h2 className="text-lg font-semibold" id="spot-course-heading">
          이 코스에서
        </h2>
        <p className="mt-3 text-sm text-muted" role="alert">
          코스 정보를 불러오지 못했어요. {state.error.message}
        </p>
      </section>
    );
  }

  const stopIndex = state.data.stops.findIndex((stop) => stop.spot.id === spotId);
  const stop = state.data.stops[stopIndex];
  if (!stop) return null;

  const previous = state.data.stops[stopIndex - 1];
  const next = state.data.stops[stopIndex + 1];

  return (
    <section
      aria-labelledby="spot-course-heading"
      className="rounded-card border border-line bg-surface-2 p-5"
    >
      <h2 className="text-lg font-semibold" id="spot-course-heading">
        이 코스에서
      </h2>
      <p className="mt-2 text-sm text-muted">
        코스 안 순번 {stop.order} / {state.data.stops.length}
      </p>
      <div className="mt-3 space-y-2">
        {previous ? (
          <Link
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 text-sm hover:bg-surface-2"
            to={`/spots/${previous.spot.id}?from=${encodeURIComponent(courseSearch.slice(1))}`}
          >
            <span>이전 · {previous.spot.name}</span>
            <span className="shrink-0 text-xs text-muted">차로 약 {stop.travelMinutes}분</span>
          </Link>
        ) : (
          <p className="text-sm text-muted">이전 장소 없음</p>
        )}
        {next ? (
          <Link
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 text-sm hover:bg-surface-2"
            to={`/spots/${next.spot.id}?from=${encodeURIComponent(courseSearch.slice(1))}`}
          >
            <span>다음 · {next.spot.name}</span>
            <span className="shrink-0 text-xs text-muted">차로 약 {next.travelMinutes}분</span>
          </Link>
        ) : (
          <p className="text-sm text-muted">다음 장소 없음</p>
        )}
      </div>
      <Link
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-accent-text"
        to={courseUrl}
      >
        코스 전체 보기
      </Link>
    </section>
  );
}

function SpotError({ error }: { error: Error }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted" role="alert">
        관광지를 불러오지 못했어요. {error.message}
      </p>
      <Link
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-medium text-white hover:bg-ink-2"
        to="/"
      >
        홈으로
      </Link>
    </div>
  );
}
