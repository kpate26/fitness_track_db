const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'WorkFit API',
    version: '1.0.0',
    description: 'Fitness and workout tracker API for ITIS 4166/5166.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth' },
    { name: 'Exercises' },
    { name: 'Workouts' },
    { name: 'Logs' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['TRAINER', 'USER'] },
        },
      },
      AuthPayload: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Exercise: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          muscle_group: {
            type: 'string',
            enum: ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE', 'CARDIO'],
          },
          difficulty: {
            type: 'string',
            enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
          },
          created_by: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      WorkoutExercise: {
        type: 'object',
        properties: {
          exercise_id: { type: 'integer' },
          sets: { type: 'integer', nullable: true },
          reps: { type: 'integer', nullable: true },
          duration_sec: { type: 'integer', nullable: true },
          order: { type: 'integer' },
        },
      },
      WorkoutSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          created_by: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      WorkoutDetailed: {
        allOf: [
          { $ref: '#/components/schemas/WorkoutSummary' },
          {
            type: 'object',
            properties: {
              exercises: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    exercise_id: { type: 'integer' },
                    sets: { type: 'integer', nullable: true },
                    reps: { type: 'integer', nullable: true },
                    duration_sec: { type: 'integer', nullable: true },
                    order: { type: 'integer' },
                    exercise: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        muscle_group: { type: 'string' },
                        difficulty: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      Log: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          workout_id: { type: 'integer' },
          duration_min: { type: 'integer' },
          notes: { type: 'string', nullable: true },
          completed_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'role'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['TRAINER', 'USER'] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthPayload' } } },
          },
          400: errorResponse('Bad Request'),
          409: errorResponse('Conflict'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login existing user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthPayload' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
        },
      },
    },
    '/api/exercises': {
      get: {
        tags: ['Exercises'],
        summary: 'List exercises',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'muscle_group', schema: { type: 'string' } },
          { in: 'query', name: 'difficulty', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } },
              },
            },
          },
          400: errorResponse('Bad Request (includes malformed query structure)'),
          401: errorResponse('Unauthorized'),
        },
      },
      post: {
        tags: ['Exercises'],
        summary: 'Create exercise',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'muscle_group', 'difficulty'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  muscle_group: { type: 'string' },
                  difficulty: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
        },
      },
    },
    '/api/exercises/{id}': {
      get: {
        tags: ['Exercises'],
        summary: 'Get exercise by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          404: errorResponse('Not Found'),
        },
      },
      put: {
        tags: ['Exercises'],
        summary: 'Update exercise',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
      delete: {
        tags: ['Exercises'],
        summary: 'Delete exercise',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Exercise' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
    },
    '/api/workouts': {
      get: {
        tags: ['Workouts'],
        summary: 'List workouts',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/WorkoutSummary' } },
              },
            },
          },
          401: errorResponse('Unauthorized'),
        },
      },
      post: {
        tags: ['Workouts'],
        summary: 'Create workout',
        security: [{ bearerAuth: [] }],
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkoutDetailed' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
        },
      },
    },
    '/api/workouts/{id}': {
      get: {
        tags: ['Workouts'],
        summary: 'Get workout by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkoutDetailed' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          404: errorResponse('Not Found'),
        },
      },
      put: {
        tags: ['Workouts'],
        summary: 'Update workout',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkoutSummary' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
      delete: {
        tags: ['Workouts'],
        summary: 'Delete workout',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkoutSummary' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
    },
    '/api/logs': {
      get: {
        tags: ['Logs'],
        summary: 'List own logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'workout_id', schema: { type: 'integer' } },
          { in: 'query', name: 'from', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'to', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Log' } },
              },
            },
          },
          400: errorResponse('Bad Request (includes malformed query structure)'),
          401: errorResponse('Unauthorized'),
        },
      },
      post: {
        tags: ['Logs'],
        summary: 'Create log',
        security: [{ bearerAuth: [] }],
        responses: {
          201: {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Log' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
    },
    '/api/logs/{id}': {
      get: {
        tags: ['Logs'],
        summary: 'Get log by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Log' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
      put: {
        tags: ['Logs'],
        summary: 'Update log',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Log' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
      delete: {
        tags: ['Logs'],
        summary: 'Delete log',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Log' } } },
          },
          400: errorResponse('Bad Request'),
          401: errorResponse('Unauthorized'),
          403: errorResponse('Forbidden'),
          404: errorResponse('Not Found'),
        },
      },
    },
  },
};
