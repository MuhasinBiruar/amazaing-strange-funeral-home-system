import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import deceasedRecordsRouter from './routes/deceasedrecords';
import staffRouter from './routes/staff';
import documentsRouter from './routes/documents';
import meRouter from './routes/me';
import representativesRouter from './routes/representatives';
import errorHandler from './middleware/error-handler';
import burialrecordsRouter from './routes/burialrecords';
import contractsRouter from './routes/contracts';
import packagesRouter from './routes/packages';
import casesRouter from './routes/cases';
import lifeplansRouter from './routes/lifeplans';
import lgucasesRouter from './routes/lgucases';
import financialRouter from './routes/financial';

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
app.use('/financial', financialRouter);
app.use('/lgucases', lgucasesRouter);
app.use('/lifeplans', lifeplansRouter);
app.use('/representatives', representativesRouter);
app.use('/contracts', contractsRouter);
app.use('/packages', packagesRouter);
app.use('/cases', casesRouter);

app.use('/api/me', meRouter);

app.use(errorHandler);

export default app;
