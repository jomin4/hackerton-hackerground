import { readFileSync } from 'node:fs';

import { spotsFileSchema } from '@cheongdo/shared';
import type { Spot } from '@cheongdo/shared';

export interface SpotRepository {
  findAll(): Spot[];
  findById(id: string): Spot | undefined;
}

export function loadSpotsFromFile(path: string): Spot[] {
  let contents: string;

  try {
    contents = readFileSync(path, 'utf8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`관광지 파일을 읽을 수 없습니다 (${path}): ${reason}`, { cause: error });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`관광지 파일 JSON 형식이 올바르지 않습니다 (${path}): ${reason}`, {
      cause: error,
    });
  }

  const result = spotsFileSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `${field}: ${issue.message}`;
      })
      .join('; ');
    throw new Error(`관광지 파일 검증에 실패했습니다 (${path}): ${issues}`, {
      cause: result.error,
    });
  }

  return result.data;
}

export function createInMemoryRepository(spots: Spot[]): SpotRepository {
  return {
    findAll: () => spots,
    findById: (id) => spots.find((spot) => spot.id === id),
  };
}
