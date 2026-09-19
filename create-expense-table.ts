import pool from './server/src/db';

async function createExpenseTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.expense (
        expenseid SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        expensedate DATE NOT NULL DEFAULT CURRENT_DATE,
        recordedby VARCHAR(100)
      );
    `);
    console.log('✅ Expense table created successfully!');
  } catch (error) {
    console.error('❌ Failed to create table:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createExpenseTable();