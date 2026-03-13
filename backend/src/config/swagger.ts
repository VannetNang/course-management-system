import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Management System API',
      version: '1.0.0',
      description: `
Welcome to the **Course Management System API** — a platform built for instructors and educators who want to sell and manage their video courses online.

With this API you can:
- 📚 Create and manage courses with rich metadata (pricing, thumbnails, discounts)
- 🎬 Organize lessons within courses, each with its own video content
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
      schemas: {
        Lesson: {
          type: 'object',
          required: ['title', 'description', 'videoUrl'],
          properties: {
            title: {
              type: 'string',
              description: 'The title of the lesson',
            },
            description: {
              type: 'string',
              description: 'A brief overview of what the lesson covers',
            },
            videoUrl: {
              type: 'string',
              format: 'uri',
              description:
                'A publicly accessible URL pointing to the lesson video',
            },
          },
          example: {
            title: 'Introduction to REST APIs',
            description:
              'In this lesson, we cover the fundamentals of REST API design and best practices.',
            videoUrl: 'https://youtube.com/watch?v=example',
          },
        },

        Course: {
          type: 'object',
          required: ['title', 'description', 'price', 'thumbnail', 'lessons'],
          properties: {
            title: {
              type: 'string',
              description: 'The display title of the course',
            },
            description: {
              type: 'string',
              description: 'A detailed description of what students will learn',
            },
            price: {
              type: 'number',
              format: 'float',
              nullable: true,
              description:
                'The full price of the course in USD (minimum $0.01)',
            },
            thumbnail: {
              type: 'string',
              format: 'binary',
              description:
                'The course thumbnail image (uploaded as multipart/form-data)',
            },
            lessons: {
              type: 'array',
              description: 'An ordered list of lessons that make up the course',
              items: {
                $ref: '#/components/schemas/Lesson',
              },
            },
            discount: {
              type: 'number',
              format: 'float',
              nullable: true,
              description:
                'An optional discounted price for the course (e.g. 14.99)',
            },
            discountQuantity: {
              type: 'integer',
              nullable: true,
              description:
                'The number of seats or purchases eligible for the discounted price',
            },
          },
          example: {
            title: 'Full-Stack Web Development Bootcamp',
            description:
              'A comprehensive full-stack crash course taught by industry professionals. Covers React, Node.js, databases, and deployment — from zero to production.',
            price: 19.99,
            thumbnail: 'course-thumbnail.png',
            lessons: [
              {
                title: 'Introduction to REST APIs',
                description:
                  'In this lesson, we cover the fundamentals of REST API design and best practices.',
                videoUrl: 'https://youtube.com/watch?v=example',
              },
            ],
            discount: 14.99,
            discountQuantity: 50,
          },
        },
      },

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

  // Scan these files for JSDoc-style @swagger / @openapi annotations
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
