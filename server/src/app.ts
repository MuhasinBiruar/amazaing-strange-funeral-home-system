import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.ts';
import deceasedRecordsRouter from './routes/deceasedrecords.ts';
import staffRouter from './routes/staff.ts';
import documentsRouter from './routes/documents.ts';
import meRouter from './routes/me.ts';
import representativesRouter from './routes/representatives.ts';
import errorHandler from './middleware/error-handler';
import burialrecordsRouter from './routes/burialrecords.ts';
import contractsRouter from './routes/contracts.ts';

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

app.use('/burialrecords', burialrecordsRouter);
app.use('/deceasedrecords', deceasedRecordsRouter);
app.use('/staff', staffRouter);
app.use('/documents', documentsRouter);
app.use('/representatives', representativesRouter);
app.use('/contracts', contractsRouter);

app.use('/api/me', meRouter);

app.use(errorHandler);

export default app;
