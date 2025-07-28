import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Load environment variables from `.env.local`
const connectionString = process.env.DATABASE_URL as string

// Create the SQL client using Supabase DB URL
const client = postgres(connectionString, { ssl: 'require' })

// Export drizzle connection
export const db = drizzle(client, { schema })
