import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createHttpError } from '../utils/httpError.js';
import {
  assertSupportedQueryKeys,
  isPlainObject,
  parsePositiveInt,
} from '../utils/validators.js';

const serializeLog = (record) => ({
  id: record.id,
  user_id: record.userId,
  workout_id: record.workoutId,
  duration_min: record.durationMin,
  notes: record.notes,
  completed_at: record.completedAt,
  created_at: record.createdAt,
  updated_at: record.updatedAt,
});

const baseWhereForUser = (user) => {
  if (user.role === 'TRAINER') {
    throw createHttpError(403, 'Only users can access logs endpoints');
  }
  return { userId: user.id };
};

export const createLog = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  baseWhereForUser(currentUser);
  const payload = req.body;
  if (!isPlainObject(payload)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }

  const workoutId = parsePositiveInt(payload.workout_id, 'workout_id');
  const durationMin = parsePositiveInt(payload.duration_min, 'duration_min');
  const completedAt = new Date(payload.completed_at);
  if (Number.isNaN(completedAt.getTime())) {
    throw createHttpError(400, 'completed_at must be a valid date/time');
  }

  const notes = payload.notes == null ? null : String(payload.notes).trim();

  const workout = await prisma.workout.findUnique({ where: { id: workoutId }, select: { id: true } });
  if (!workout) {
    throw createHttpError(404, 'Workout not found');
  }

  const created = await prisma.log.create({
    data: {
      userId: currentUser.id,
      workoutId,
      durationMin,
      notes,
      completedAt,
    },
  });

  res.status(201).json(serializeLog(created));
});

export const listLogs = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  assertSupportedQueryKeys(req.query, ['workout_id', 'from', 'to']);
  const where = baseWhereForUser(currentUser);

  if (req.query.workout_id !== undefined) {
    const workoutId = parsePositiveInt(req.query.workout_id, 'workout_id');
    where.workoutId = workoutId;
  }

  const from = req.query.from == null ? null : new Date(req.query.from);
  const to = req.query.to == null ? null : new Date(req.query.to);
  if (from !== null && Number.isNaN(from.getTime())) {
    throw createHttpError(400, 'from must be a valid date');
  }
  if (to !== null && Number.isNaN(to.getTime())) {
    throw createHttpError(400, 'to must be a valid date');
  }

  if (from || to) {
    where.completedAt = {};
    if (from) where.completedAt.gte = from;
    if (to) where.completedAt.lte = to;
  }

  const logs = await prisma.log.findMany({
    where,
    orderBy: { id: 'asc' },
  });

  res.json(logs.map(serializeLog));
});

export const getLogById = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const id = parsePositiveInt(req.params.id, 'id');
  baseWhereForUser(currentUser);

  const log = await prisma.log.findUnique({ where: { id } });
  if (!log) {
    throw createHttpError(404, 'Log not found');
  }
  if (log.userId !== currentUser.id) {
    throw createHttpError(403, 'You can only access your own logs');
  }

  res.json(serializeLog(log));
});

export const updateLogById = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const id = parsePositiveInt(req.params.id, 'id');
  baseWhereForUser(currentUser);

  const existing = await prisma.log.findUnique({ where: { id } });
  if (!existing) {
    throw createHttpError(404, 'Log not found');
  }
  if (existing.userId !== currentUser.id) {
    throw createHttpError(403, 'You can only update your own logs');
  }

  const payload = req.body;
  if (!isPlainObject(payload)) {
    throw createHttpError(400, 'Request body must be a JSON object');
  }
  if (Object.keys(payload).length === 0) {
    throw createHttpError(400, 'At least one field is required for update');
  }

  const data = {};
  if (payload.duration_min !== undefined) {
    data.durationMin = parsePositiveInt(payload.duration_min, 'duration_min');
  }
  if (payload.notes !== undefined) {
    data.notes = payload.notes == null ? null : String(payload.notes).trim();
  }
  if (payload.completed_at !== undefined) {
    const completedAt = new Date(payload.completed_at);
    if (Number.isNaN(completedAt.getTime())) {
      throw createHttpError(400, 'completed_at must be a valid date/time');
    }
    data.completedAt = completedAt;
  }

  const updated = await prisma.log.update({
    where: { id },
    data,
  });

  res.json(serializeLog(updated));
});

export const deleteLogById = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const id = parsePositiveInt(req.params.id, 'id');
  baseWhereForUser(currentUser);

  const existing = await prisma.log.findUnique({ where: { id } });
  if (!existing) {
    throw createHttpError(404, 'Log not found');
  }
  if (existing.userId !== currentUser.id) {
    throw createHttpError(403, 'You can only delete your own logs');
  }

  const deleted = await prisma.log.delete({ where: { id } });
  res.json(serializeLog(deleted));
});
