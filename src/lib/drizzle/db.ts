import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Only create connection if we are  in the server
if (typeof window !== 'undefined') {
  throw new Error(
    'Database operations should only be performed on the server side'
  );
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
export const db = drizzle(client);