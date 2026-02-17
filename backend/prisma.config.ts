import { defineConfig } from 'prisma/config';
import config from './src/config/config.ts';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: config.database_url,
  },
});
