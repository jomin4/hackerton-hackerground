import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import type { Course } from '@cheongdo/shared';

import { fetchJson } from '../lib/api.js';

type CourseState =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: Course; error: null }
  | { status: 'error'; data: null; error: Error };

const loadingState: CourseState = { status: 'loading', data: null, error: null };

export function useCourse(): CourseState {
  const { search } = useLocation();
  const [result, setResult] = useState<{ search: string; state: CourseState }>({
    search: '',
    state: loadingState,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void fetchJson<Course>(`/api/course${search}`, controller.signal)
      .then((data) => {
        if (active) setResult({ search, state: { status: 'success', data, error: null } });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setResult({
          search,
          state: {
            status: 'error',
            data: null,
            error: error instanceof Error ? error : new Error('코스를 불러오지 못했어요.'),
          },
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [search]);

  return result.search === search ? result.state : loadingState;
}
