import 'dotenv/config';
import app from './app.ts';
import pool from './db.ts';

const PORT = process.env.APP_PORT ? Number(process.env.APP_PORT) : 4000;

app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1 FROM DeceasedRecord');

    console.log(`Server listening on http://localhost:${PORT}`);
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed', error);
  }
});
