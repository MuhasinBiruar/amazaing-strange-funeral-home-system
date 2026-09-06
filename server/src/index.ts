import 'dotenv/config';
import app from './app.js'; // or "./app" depending on your bundler setup
import pool from './db.js';

// Prefer the explicit local API port; deployment platforms provide PORT.
const PORT = Number(process.env.APP_PORT || process.env.PORT) || 4000;

// Listen on all network interfaces ('0.0.0.0') for containerized environments
app.listen(PORT, '0.0.0.0', async () => {
  try {
    await pool.query('SELECT 1 FROM DeceasedRecord');

    console.log(`Server listening on port ${PORT}`);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
});
