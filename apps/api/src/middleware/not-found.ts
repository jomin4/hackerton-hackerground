import type { RequestHandler } from 'express';

import { HttpError } from '../lib/http-error.js';

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new HttpError(404, 'NOT_FOUND', '요청한 경로를 찾을 수 없어요.'));
};
