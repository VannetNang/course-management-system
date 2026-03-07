import swaggerJsdoc from 'swagger-jsdoc';
import config from './config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Management System',
      version: '1.0.0',
      description:
        'API for for teachers/instructors who want to sell their video courses online. It helps them by giving them a place to upload lessons and manage their students.',
    },
    servers: [{ url: `http://localhost:${config.port}` }],
  },
  // Path to API docs
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
