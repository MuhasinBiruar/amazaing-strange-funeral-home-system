import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.ts';
import deceasedRecordsRouter from './routes/deceasedrecords.ts';
import staffRouter from './routes/staff.ts';
import documentsRouter from './routes/documents.ts';
import meRouter from './routes/me.ts';
import errorHandler from './middleware/error-handler.ts';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Authorization header for token-based auth
    credentials: true,
  }),
);
// Better Auth's own routes — must come BEFORE express.json()
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());

app.use('/deceasedrecords', deceasedRecordsRouter);
app.use('/staff', staffRouter);
app.use('/documents', documentsRouter);

app.use(errorHandler);

app.use('/api/me', meRouter);

export default app;
