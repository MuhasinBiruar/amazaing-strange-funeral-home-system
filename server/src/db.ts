import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL ?? process.env.DB_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL or DB_URL environment variable");
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false,
});

export default pool;