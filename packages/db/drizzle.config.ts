import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  schemaFilter: ['iam', 'audit'],
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://neodb:neodb-dev@localhost:55432/neodb' },
});
