export const ROLES = {
  TRAINER: 'TRAINER',
  USER: 'USER',
};

export const MUSCLE_GROUPS = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO'];
export const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
export const AUTH_HEADER_PREFIX = 'Bearer ';

export const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '8080', 10);
export const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
