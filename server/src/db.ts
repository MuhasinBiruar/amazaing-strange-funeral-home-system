import 'dotenv/config';
import { Pool, types } from 'pg';

// Read timezone-less values as UTC so every machine matches production
// (Vercel runs in UTC). 1114 = timestamp without time zone, 1082 = date.
types.setTypeParser(1114, (value) => new Date(`${value.replace(' ', 'T')}Z`));
types.setTypeParser(1082, (value) => new Date(`${value}T00:00:00Z`));

const connectionString = process.env.DATABASE_URL ?? process.env.DB_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL or DB_URL environment variable');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  options: '-c timezone=UTC',
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

export default pool;
