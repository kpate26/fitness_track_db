import { prisma } from '../lib/prisma.js';
import { createHttpError } from '../utils/httpError.js';
import {
  parsePositiveInt,
  validateWorkoutCreateBody,
  validateWorkoutUpdateBody,
} from '../utils/validators.js';

const workoutWithExercisesInclude = {
  workoutExercises: {
    orderBy: { order: 'asc' },
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          muscleGroup: true,
          difficulty: true,
        },
      },
    },
  },
};

const serializeWorkout = (workout) => ({
  id: workout.id,
  name: workout.name,
  description: workout.description,
  created_by: workout.createdBy,
  created_at: workout.createdAt,
  updated_at: workout.updatedAt,
});

const serializeWorkoutDetails = (workout) => ({
  ...serializeWorkout(workout),
  exercises: workout.workoutExercises.map((entry) => ({
    exercise_id: entry.exerciseId,
    sets: entry.sets,
    reps: entry.reps,
    duration_sec: entry.durationSec,
    order: entry.order,
    exercise: {
      id: entry.exercise.id,
      name: entry.exercise.name,
      muscle_group: entry.exercise.muscleGroup,
      difficulty: entry.exercise.difficulty,
    },
  })),
});

async function assertWorkoutOwner(workoutId, userId) {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw createHttpError(404, 'workout not found');
  }
  if (workout.createdBy !== userId) {
    throw createHttpError(403, 'only the trainer who created this workout may modify it');
  }
  return workout;
}

export async function createWorkout(req, res) {
  const { name, description, exercises } = validateWorkoutCreateBody(req.body);
  const orderSet = new Set();
  for (const entry of exercises) {
    if (orderSet.has(entry.order)) {
      throw createHttpError(400, 'exercise order values must be unique within a workout');
    }
    orderSet.add(entry.order);
  }

  const created = await prisma.$transaction(async (tx) => {
    if (exercises.length > 0) {
      const uniqueIds = [...new Set(exercises.map((entry) => entry.exerciseId))];
      const existing = await tx.exercise.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      if (existing.length !== uniqueIds.length) {
        throw createHttpError(400, 'one or more exercise_id values do not exist');
      }
    }

    const workout = await tx.workout.create({
      data: {
        name,
        description,
        createdBy: req.user.id,
      },
    });

    if (exercises.length > 0) {
      await tx.workoutExercise.createMany({
        data: exercises.map((entry) => ({
          workoutId: workout.id,
          exerciseId: entry.exerciseId,
          sets: entry.sets,
          reps: entry.reps,
          durationSec: entry.durationSec,
          order: entry.order,
        })),
      });
    }

    return tx.workout.findUnique({
      where: { id: workout.id },
      include: workoutWithExercisesInclude,
    });
  });

  res.status(201).json(serializeWorkoutDetails(created));
}

export async function getWorkouts(req, res) {
  const workouts = await prisma.workout.findMany({
    orderBy: { id: 'asc' },
  });
  res.json(workouts.map(serializeWorkout));
}

export async function getWorkoutById(req, res) {
  const id = parsePositiveInt(req.params.id, 'id');
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: workoutWithExercisesInclude,
  });
  if (!workout) {
    throw createHttpError(404, 'workout not found');
  }
  res.json(serializeWorkoutDetails(workout));
}

export async function updateWorkout(req, res) {
  const id = parsePositiveInt(req.params.id, 'id');
  await assertWorkoutOwner(id, req.user.id);

  const data = validateWorkoutUpdateBody(req.body);
  const updated = await prisma.workout.update({
    where: { id },
    data,
  });
  res.json(serializeWorkout(updated));
}

export async function deleteWorkout(req, res) {
  const id = parsePositiveInt(req.params.id, 'id');
  await assertWorkoutOwner(id, req.user.id);

  const deleted = await prisma.workout.delete({ where: { id } });
  res.json(serializeWorkout(deleted));
}
