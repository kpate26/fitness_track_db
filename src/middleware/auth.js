import jwt from 'jsonwebtoken';
import { AUTH_HEADER_PREFIX, JWT_SECRET } from '../config/constants.js';
import prisma from '../lib/prisma.js';
import { createHttpError } from '../utils/httpError.js';
import { parsePositiveInt } from '../utils/validators.js';

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string' || !authorizationHeader.startsWith(AUTH_HEADER_PREFIX)) {
    throw createHttpError(401, 'Missing or invalid Authorization header');
  }
  return authorizationHeader.slice(AUTH_HEADER_PREFIX.length).trim();
}

export async function requireAuth(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = parsePositiveInt(payload.sub, 'token subject');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      throw createHttpError(401, 'Invalid token');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createHttpError(401, 'Invalid or expired token'));
      return;
    }
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(createHttpError(401, 'Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(createHttpError(403, 'Forbidden'));
      return;
    }
    next();
  };
}
