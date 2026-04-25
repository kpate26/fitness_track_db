import bcrypt from 'bcryptjs';
import { Difficulty, MuscleGroup, PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for seeding');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function upsertUser({ name, email, role, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { name, email, role, passwordHash },
  });
}

async function main() {
  const trainer = await upsertUser({
    name: 'Trainer One',
    email: 'trainer@example.com',
    role: Role.TRAINER,
    password: 'Password123!',
  });

  const user = await upsertUser({
    name: 'User One',
    email: 'user@example.com',
    role: Role.USER,
    password: 'Password123!',
  });

  await upsertUser({
    name: 'Not Owner User',
    email: 'not-owner@example.com',
    role: Role.USER,
    password: 'Password123!',
  });

  const bench = await prisma.exercise.upsert({
    where: { id: 1 },
    update: {
      name: 'Bench Press',
      description: 'Compound chest press.',
      muscleGroup: MuscleGroup.CHEST,
      difficulty: Difficulty.INTERMEDIATE,
      createdBy: trainer.id,
    },
    create: {
      id: 1,
      name: 'Bench Press',
      description: 'Compound chest press.',
      muscleGroup: MuscleGroup.CHEST,
      difficulty: Difficulty.INTERMEDIATE,
      createdBy: trainer.id,
    },
  });

  const squat = await prisma.exercise.upsert({
    where: { id: 2 },
    update: {
      name: 'Squat',
      description: 'Compound leg movement.',
      muscleGroup: MuscleGroup.LEGS,
      difficulty: Difficulty.BEGINNER,
      createdBy: trainer.id,
    },
    create: {
      id: 2,
      name: 'Squat',
      description: 'Compound leg movement.',
      muscleGroup: MuscleGroup.LEGS,
      difficulty: Difficulty.BEGINNER,
      createdBy: trainer.id,
    },
  });

  const workout = await prisma.workout.upsert({
    where: { id: 1 },
    update: {
      name: 'Upper Body Blast',
      description: 'Focused upper body strength session.',
      createdBy: trainer.id,
    },
    create: {
      id: 1,
      name: 'Upper Body Blast',
      description: 'Focused upper body strength session.',
      createdBy: trainer.id,
    },
  });

  await prisma.workoutExercise.deleteMany({ where: { workoutId: workout.id } });
  await prisma.workoutExercise.createMany({
    data: [
      { workoutId: workout.id, exerciseId: bench.id, order: 1, sets: 4, reps: 10, durationSec: null },
      { workoutId: workout.id, exerciseId: squat.id, order: 2, sets: 3, reps: 12, durationSec: null },
    ],
  });

  await prisma.log.upsert({
    where: { id: 1 },
    update: {
      userId: user.id,
      workoutId: workout.id,
      durationMin: 45,
      notes: 'Felt strong today.',
      completedAt: new Date('2026-04-25T00:00:00.000Z'),
    },
    create: {
      id: 1,
      userId: user.id,
      workoutId: workout.id,
      durationMin: 45,
      notes: 'Felt strong today.',
      completedAt: new Date('2026-04-25T00:00:00.000Z'),
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
