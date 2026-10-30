import { z } from 'zod';
import { COMPANIONS, HOURS, TAGS, ZONES } from './constants.js';
import type { CourseQuery } from './types.js';

export function splitCsv(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export const spotSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    summary: z.string().min(1).max(80),
    description: z.array(z.string().min(1)).min(1),
    tips: z.array(z.string().min(1)),
    zone: z.enum(ZONES),
    routeOrder: z.number().int().min(1),
    tags: z.array(z.enum(TAGS)).min(1),
    goodFor: z.array(z.enum(COMPANIONS)).min(1),
    stayMinutes: z.number().int().min(10).max(240),
    address: z.string().min(1),
    hours: z
      .object({
        weekday: z.string().optional(),
        weekend: z.string().optional(),
        note: z.string().optional(),
      })
      .optional(),
    closed: z.string().optional(),
    fee: z.string().optional(),
    phone: z.string().optional(),
    source: z.string().min(1),
    checkedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine(
    (spot) =>
      spot.checkedAt !== undefined ||
      (spot.hours === undefined &&
        spot.closed === undefined &&
        spot.fee === undefined &&
        spot.phone === undefined),
    {
      message: '운영 정보가 있으면 checkedAt(확인 날짜)이 필요합니다',
      path: ['checkedAt'],
    },
  );

export const spotsFileSchema = z
  .array(spotSchema)
  .refine((spots) => new Set(spots.map((spot) => spot.id)).size === spots.length, {
    message: 'spot id가 중복되었습니다',
  });

const HOURS_MESSAGE = '여행 시간은 2, 4, 6 중 하나여야 해요.';

export const courseQuerySchema = z.object({
  hours: z.coerce
    .number({ message: HOURS_MESSAGE })
    .pipe(z.literal(HOURS, { message: HOURS_MESSAGE })),
  with: z.enum(COMPANIONS, {
    message: '동행은 solo, couple, family, friends 중 하나여야 해요.',
  }),
  tags: z
    .string({ message: '관심사를 하나 이상 골라주세요.' })
    .transform(splitCsv)
    .pipe(
      z
        .array(
          z.enum(TAGS, {
            message: '관심사는 nature, history, experience, food, photo 중에서 골라주세요.',
          }),
        )
        .min(1, '관심사를 하나 이상 골라주세요.'),
    )
    .transform((tags) => TAGS.filter((tag) => tags.includes(tag))),
  exclude: z
    .string()
    .optional()
    .transform((value) => (value ? splitCsv(value) : [])),
});

export type ParsedCourseQuery = z.infer<typeof courseQuerySchema>;
export type CourseQueryTypeCheck<Output extends CourseQuery = ParsedCourseQuery> = Output;

export const spotsQuerySchema = z.object({
  tag: z
    .enum(TAGS, {
      message: '관심사는 nature, history, experience, food, photo 중에서 골라주세요.',
    })
    .optional(),
  zone: z
    .enum(ZONES, {
      message: '권역은 cheongdo-eup, hwayang-eup, unmun-myeon, iseo-myeon 중 하나여야 해요.',
    })
    .optional(),
});
