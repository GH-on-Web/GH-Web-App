import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import healthRouter from './routes/health.js';
import grasshopperRouter from './routes/grasshopper.js';
import ghToJsonRouter from './routes/ghToJson.js';
import jsonToGhRouter from './routes/jsonToGh.js';
import testScriptRouter from './routes/testScript.js';
import versionRouter from './routes/version.js';
import scriptsRouter from './routes/scripts.js';
import { initSchema } from './db/driver.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/health', healthRouter);
app.use('/gh-to-json', ghToJsonRouter);
app.use('/json-to-gh', jsonToGhRouter);
app.use('/test-script', testScriptRouter);
app.use('/grasshopper', grasshopperRouter);
app.use('/version', versionRouter);
app.use('/scripts', scriptsRouter);

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
    },
  });
});

const PORT = process.env.PORT || 4001;

app.listen(PORT, async () => {
  console.log(`backend-compute-gateway listening on port ${PORT}`);
  await initSchema();
});
