import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { COMPANION_LABELS, TAG_LABELS } from '@cheongdo/shared';

import { CourseSummary } from '../components/course/CourseSummary.js';
import { CourseTimeline } from '../components/course/CourseTimeline.js';
import { ExcludedSpots } from '../components/course/ExcludedSpots.js';
import { Button } from '../components/ui/Button.js';
import { Chip } from '../components/ui/Chip.js';
import { Container } from '../components/ui/Container.js';
import { Check, Clock, Copy } from '../components/ui/icons.js';
import { useCourse } from '../hooks/useCourse.js';

const companionHeadlines = {
  couple: '커플과 함께하는',
  family: '가족과 함께하는',
  friends: '친구들과 함께하는',
} as const;

export function CoursePage() {
  const location = useLocation();
  const state = useCourse();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareUrl = `${window.location.origin}${location.pathname}${location.search}`;

  useEffect(
    () => () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyLink() {
    setCopied(false);
    setCopyFailed(false);
    if (copyTimer.current !== null) clearTimeout(copyTimer.current);

    try {
      if (!navigator.clipboard?.writeText) throw new Error('클립보드를 사용할 수 없어요.');
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  }

  return (
    <>
      <section className="bg-surface-2 py-8 sm:py-10">
        <Container>
          <nav aria-label="현재 위치" className="text-xs text-muted">
            <Link className="inline-flex min-h-11 items-center hover:text-ink" to="/">
              홈
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span aria-current="page" className="text-ink-3">
              추천 코스
            </span>
          </nav>

          {state.status === 'success' ? (
            <>
              <h1 className="mt-3 text-[clamp(28px,3.4vw,42px)] leading-tight font-bold tracking-[-0.035em]">
                {state.data.conditions.with === 'solo'
                  ? `혼자 떠나는 ${state.data.conditions.hours}시간 청도 코스`
                  : `${companionHeadlines[state.data.conditions.with]} ${state.data.conditions.hours}시간 청도 코스`}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2">
                <Chip className="border border-line bg-surface">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  {state.data.conditions.hours}시간
                </Chip>
                <Chip className="border border-line bg-surface">
                  {COMPANION_LABELS[state.data.conditions.with]}
                </Chip>
                {state.data.conditions.tags.map((tag) => (
                  <Chip className="border border-line bg-surface" key={tag}>
                    {TAG_LABELS[tag]}
                  </Chip>
                ))}
              </div>
            </>
          ) : (
            <h1 className="mt-3 text-[clamp(28px,3.4vw,42px)] leading-tight font-bold tracking-[-0.035em]">
              추천 코스
            </h1>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium hover:bg-surface-2"
              to={`/${location.search}`}
            >
              조건 수정
            </Link>
            <Button className="px-4" onClick={copyLink} type="button">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span aria-live="polite">{copied ? '복사됨' : '링크 복사'}</span>
            </Button>
          </div>
          {copyFailed && (
            <div className="mt-3 max-w-xl">
              <label className="mb-1 block text-xs text-muted" htmlFor="share-url">
                링크를 선택해 복사해 주세요
              </label>
              <input
                className="min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 font-mono text-xs text-ink"
                id="share-url"
                onFocus={(event) => event.currentTarget.select()}
                readOnly
                value={shareUrl}
              />
            </div>
          )}
        </Container>
      </section>

      <Container className="flex flex-wrap gap-6 py-8 sm:py-10">
        {state.status === 'loading' ? (
          <CourseSkeleton />
        ) : state.status === 'error' ? (
          <ErrorState message={state.error.message} />
        ) : state.data.stops.length === 0 ? (
          <EmptyCourse />
        ) : (
          <>
            <div className="order-2 w-full min-w-0 flex-[999_1_560px] md:order-1">
              <CourseTimeline course={state.data} fromQuery={location.search.replace(/^\?/, '')} />
            </div>
            <aside className="order-1 w-full min-w-0 flex-[1_1_320px] md:order-2">
              <div className="space-y-4">
                <CourseSummary course={state.data} />
                <ExcludedSpots course={state.data} />
                <p className="rounded-card border border-line bg-surface-2 p-4 text-xs leading-5 text-muted">
                  이동 시간은 같은 권역 10분, 권역 간 25분으로 계산했어요. 실제 교통 상황에 따라
                  달라질 수 있어요.
                </p>
              </div>
            </aside>
          </>
        )}
      </Container>
    </>
  );
}

function CourseSkeleton() {
  return (
    <p className="w-full py-16 text-center text-sm text-muted" role="status">
      코스를 계산하고 있어요
    </p>
  );
}

function EmptyCourse() {
  return (
    <p className="w-full py-16 text-center text-sm text-muted" role="status">
      조건에 맞는 장소를 찾지 못했어요
    </p>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <p className="w-full py-16 text-center text-sm text-muted" role="alert">
      코스를 불러오지 못했어요. {message}
    </p>
  );
}
