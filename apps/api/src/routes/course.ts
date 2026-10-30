import { courseQuerySchema } from '@cheongdo/shared';
import { Router } from 'express';

import type { SpotRepository } from '../data/spot-repository.js';
import { recommendCourse } from '../domain/recommend-course.js';

export function createCourseRouter(spots: SpotRepository): Router {
  const router = Router();

  router.get('/', (request, response) => {
    const query = courseQuerySchema.parse(request.query);
    const course = recommendCourse(spots.findAll(), query);

    response.setHeader('Cache-Control', 'public, max-age=300');
    response.json(course);
  });

  return router;
}
