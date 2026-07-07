import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;

if (connectionString && connectionString !== 'postgres://user:password@host:port/database') {
  try {
    client = postgres(connectionString);
    db = drizzle(client, { schema });
    console.log('Database connected');
  } catch (err) {
    console.warn('Database connection failed, running without DB:', err);
  }
} else {
  console.warn('No DATABASE_URL configured, running without database');
}

export { db, client };
