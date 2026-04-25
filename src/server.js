import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { DEFAULT_PORT } from './config/constants.js';
import { openApiSpec } from './config/openapi.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import logRoutes from './routes/logRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use('/api/auth', authRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/logs', logRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number.parseInt(process.env.PORT ?? DEFAULT_PORT, 10);

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
