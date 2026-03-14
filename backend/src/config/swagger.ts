import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options = {
  definition: {
    openapi: '3.0.0',
    tags: [
      {
        name: 'Authentication',
      },
      {
        name: 'Courses',
      },
      {
        name: 'Lessons',
      },
      {
        name: 'Enrolments',
      },
      {
        name: 'Analytics',
      },
      {
        name: 'Sales',
      },
    ],
    info: {
      title: 'Course Management System API',
      version: '1.0.0',
      description: `
Welcome to the **Course Management System API** — a platform built for instructors and educators who want to sell and manage their video courses online.

With this API you can:
- 📚 Create and manage courses
- 🎬 Organize lessons within courses, each with its own video content coming from your Youtube URL
- 👩‍🎓 Manage student enrollments and track progress
- 🔐 Secure all operations with JWT-based authentication
      `.trim(),
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      responses: {
        400: {
          description:
            '**Bad Request** — The request is missing required fields or contains invalid data.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Missing required field: title',
                  },
                },
              },
            },
          },
        },
        401: {
          description:
            '**Unauthorized** — No token was provided, or the token is invalid / expired.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Invalid or expired token',
                  },
                },
              },
            },
          },
        },
        403: {
          description:
            '**Forbidden** — Your account does not have the required permissions to perform this action. Admin role required.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Access denied: admin role required',
                  },
                },
              },
            },
          },
        },
        404: {
          description:
            '**Not Found** — The requested course or resource does not exist.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Course not found' },
                },
              },
            },
          },
        },
      },

      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: `Bearer <token>`',
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
