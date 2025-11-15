import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRouter from './routes/health.js';
import computeRouter from './routes/compute.js';
import scriptsRouter from './routes/scripts.js';
import utilityScriptsRouter from './routes/utilityScripts.js';
import versionRouter from './routes/version.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/health', healthRouter);
app.use('/scripts', scriptsRouter);
app.use('/utility', utilityScriptsRouter);
app.use('/compute', computeRouter);
app.use('/version', versionRouter);

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
    },
  });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`backend-compute-gateway listening on port ${PORT}`);
});
