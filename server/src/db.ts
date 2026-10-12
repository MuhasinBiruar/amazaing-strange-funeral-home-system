import 'dotenv/config';
import { Pool } from 'pg';

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
