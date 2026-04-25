import prismaClientPkg from '@prisma/client';
import { createHttpError } from './httpError.js';

const { Difficulty, MuscleGroup, Role } = prismaClientPkg;

export const ALLOWED_EXERCISE_MUSCLE_GROUPS = new Set(Object.values(MuscleGroup));
export const ALLOWED_EXERCISE_DIFFICULTIES = new Set(Object.values(Difficulty));
const ROLE_VALUES = new Set(Object.values(Role));

export const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const assertRequiredString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw createHttpError(400, `${fieldName} is required`);
  }
  return value.trim();
};

export const parseRole = (value) => {
  const normalized = value ?? Role.USER;
  if (!ROLE_VALUES.has(normalized)) {
    throw createHttpError(400, `role must be one of: ${Object.values(Role).join(', ')}`);
  }
  return normalized;
};

export const parsePositiveIntParam = (value, fieldName = 'id') => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(400, `${fieldName} must be a positive integer`);
  }
  return parsed;
};

export const parsePositiveInt = (value, fieldName = 'id') =>
  parsePositiveIntParam(value, fieldName);

export const assertSupportedQueryKeys = (query, allowedKeys) => {
  if (!isPlainObject(query)) {
    throw createHttpError(400, 'Query parameters are not structured correctly');
  }

  for (const [key, value] of Object.entries(query)) {
    if (!allowedKeys.includes(key)) {
      throw createHttpError(400, `Unsupported query parameter: ${key}`);
    }

    if (Array.isArray(value) || isPlainObject(value)) {
      throw createHttpError(400, 'Query parameters are not structured correctly');
    }
  }
};

export const parseId = (value, fieldName = 'id') => parsePositiveIntParam(value, fieldName);

export const parseWorkoutPayload = (body, requireAllFields = false) => {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const next = {};
  if (requireAllFields || Object.hasOwn(body, 'name')) {
    next.name = assertRequiredString(body.name, 'name');
  }
  if (requireAllFields || Object.hasOwn(body, 'description')) {
    next.description = assertRequiredString(body.description, 'description');
  }
  return next;
};

const parseWorkoutExerciseInput = (entry, index) => {
  if (!isPlainObject(entry)) {
    throw createHttpError(400, `exercises[${index}] must be an object`);
  }

  const parsed = {
    exerciseId: parsePositiveIntParam(entry.exercise_id, `exercises[${index}].exercise_id`),
    order: parsePositiveIntParam(entry.order, `exercises[${index}].order`),
    sets: null,
    reps: null,
    durationSec: null,
  };

  if (entry.sets !== undefined && entry.sets !== null) {
    parsed.sets = parsePositiveIntParam(entry.sets, `exercises[${index}].sets`);
  }
  if (entry.reps !== undefined && entry.reps !== null) {
    parsed.reps = parsePositiveIntParam(entry.reps, `exercises[${index}].reps`);
  }
  if (entry.duration_sec !== undefined && entry.duration_sec !== null) {
    parsed.durationSec = parsePositiveIntParam(entry.duration_sec, `exercises[${index}].duration_sec`);
  }

  return parsed;
};

export const parseWorkoutExercises = (exercises) => {
  if (exercises === undefined) {
    return [];
  }
  if (!Array.isArray(exercises)) {
    throw createHttpError(400, 'exercises must be an array when provided');
  }
  return exercises.map((entry, index) => parseWorkoutExerciseInput(entry, index));
};

export const assertPositiveInt = (value, fieldName = 'id') => parsePositiveIntParam(value, fieldName);

export const coerceOptionalInt = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return parsePositiveIntParam(value, fieldName);
};

export const coerceDate = (value, fieldName) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date`);
  }
  return date;
};

export const readBody = (req) => {
  if (!isPlainObject(req.body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }
  return req.body;
};

export const assertAllowedQueryKeys = (query, allowedKeys) => {
  assertSupportedQueryKeys(query, allowedKeys);
};

export const validateSignupBody = (body) => {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const name = assertRequiredString(body.name, 'name');
  const email = assertRequiredString(body.email, 'email').toLowerCase();
  const password = assertRequiredString(body.password, 'password');
  const role = parseRole(body.role);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError(400, 'email format is invalid');
  }
  if (password.length < 6) {
    throw createHttpError(400, 'password must be at least 6 characters');
  }

  return { name, email, password, role };
};

export const validateLoginBody = (body) => {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const email = assertRequiredString(body.email, 'email').toLowerCase();
  const password = assertRequiredString(body.password, 'password');
  return { email, password };
};

export const validateExerciseCreateBody = (body) => {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const name = assertRequiredString(body.name, 'name');
  const description = assertRequiredString(body.description, 'description');
  if (!ALLOWED_EXERCISE_MUSCLE_GROUPS.has(body.muscle_group)) {
    throw createHttpError(
      400,
      `muscle_group must be one of: ${Array.from(ALLOWED_EXERCISE_MUSCLE_GROUPS).join(', ')}`
    );
  }
  if (!ALLOWED_EXERCISE_DIFFICULTIES.has(body.difficulty)) {
    throw createHttpError(
      400,
      `difficulty must be one of: ${Array.from(ALLOWED_EXERCISE_DIFFICULTIES).join(', ')}`
    );
  }

  return {
    name,
    description,
    muscleGroup: body.muscle_group,
    difficulty: body.difficulty,
  };
};

export const validateExerciseUpdateBody = (body) => {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const next = {};
  if (Object.hasOwn(body, 'name')) {
    next.name = assertRequiredString(body.name, 'name');
  }
  if (Object.hasOwn(body, 'description')) {
    next.description = assertRequiredString(body.description, 'description');
  }
  if (Object.hasOwn(body, 'muscle_group')) {
    if (!ALLOWED_EXERCISE_MUSCLE_GROUPS.has(body.muscle_group)) {
      throw createHttpError(
        400,
        `muscle_group must be one of: ${Array.from(ALLOWED_EXERCISE_MUSCLE_GROUPS).join(', ')}`
      );
    }
    next.muscleGroup = body.muscle_group;
  }
  if (Object.hasOwn(body, 'difficulty')) {
    if (!ALLOWED_EXERCISE_DIFFICULTIES.has(body.difficulty)) {
      throw createHttpError(
        400,
        `difficulty must be one of: ${Array.from(ALLOWED_EXERCISE_DIFFICULTIES).join(', ')}`
      );
    }
    next.difficulty = body.difficulty;
  }

  if (Object.keys(next).length === 0) {
    throw createHttpError(400, 'At least one field must be provided for update');
  }

  return next;
};

export const validateWorkoutCreateBody = (body) => {
  if (!isPlainObject(body)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }
  const payload = parseWorkoutPayload(body, true);
  return {
    ...payload,
    exercises: parseWorkoutExercises(body.exercises),
  };
};

export const validateWorkoutUpdateBody = (body) => {
  const payload = parseWorkoutPayload(body, false);
  if (Object.keys(payload).length === 0) {
    throw createHttpError(400, 'At least one field must be provided for update');
  }
  return payload;
};
