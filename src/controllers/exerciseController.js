import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../utils/httpError.js';
import {
  ALLOWED_EXERCISE_DIFFICULTIES,
  ALLOWED_EXERCISE_MUSCLE_GROUPS,
  assertSupportedQueryKeys,
  parsePositiveInt,
  validateExerciseCreateBody,
  validateExerciseUpdateBody,
} from '../utils/validators.js';

const serializeExercise = (exercise) => ({
  id: exercise.id,
  name: exercise.name,
  description: exercise.description,
  muscle_group: exercise.muscleGroup,
  difficulty: exercise.difficulty,
  created_by: exercise.createdBy,
  created_at: exercise.createdAt,
  updated_at: exercise.updatedAt,
});

export async function createExercise(req, res) {
  const payload = validateExerciseCreateBody(req.body);
  const created = await prisma.exercise.create({
    data: {
      ...payload,
      createdBy: req.user.id,
    },
  });
  res.status(201).json(serializeExercise(created));
}

export async function listExercises(req, res) {
  assertSupportedQueryKeys(req.query, ['muscle_group', 'difficulty']);

  const where = {};
  if (req.query.muscle_group !== undefined) {
    if (
      typeof req.query.muscle_group !== 'string' ||
      !ALLOWED_EXERCISE_MUSCLE_GROUPS.has(req.query.muscle_group)
    ) {
      throw createHttpError(400, 'muscle_group query parameter is invalid');
    }
    where.muscleGroup = req.query.muscle_group;
  }
  if (req.query.difficulty !== undefined) {
    if (
      typeof req.query.difficulty !== 'string' ||
      !ALLOWED_EXERCISE_DIFFICULTIES.has(req.query.difficulty)
    ) {
      throw createHttpError(400, 'difficulty query parameter is invalid');
    }
    where.difficulty = req.query.difficulty;
  }

  const exercises = await prisma.exercise.findMany({
    where,
    orderBy: { id: 'asc' },
  });
  res.status(200).json(exercises.map(serializeExercise));
}

export async function getExerciseById(req, res) {
  const id = parsePositiveInt(req.params.id);
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    throw createHttpError(404, 'Exercise not found');
  }
  res.status(200).json(serializeExercise(exercise));
}

export async function updateExerciseById(req, res) {
  const id = parsePositiveInt(req.params.id);
  const payload = validateExerciseUpdateBody(req.body);

  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) {
    throw createHttpError(404, 'Exercise not found');
  }
  if (existing.createdBy !== req.user.id) {
    throw createHttpError(403, 'Only the trainer who created this exercise can update it');
  }

  const updated = await prisma.exercise.update({
    where: { id },
    data: payload,
  });
  res.status(200).json(serializeExercise(updated));
}

export async function deleteExerciseById(req, res) {
  const id = parsePositiveInt(req.params.id);
  const existing = await prisma.exercise.findUnique({ where: { id } });
  if (!existing) {
    throw createHttpError(404, 'Exercise not found');
  }
  if (existing.createdBy !== req.user.id) {
    throw createHttpError(403, 'Only the trainer who created this exercise can delete it');
  }

  const deleted = await prisma.exercise.delete({ where: { id } });
  res.status(200).json(serializeExercise(deleted));
}
