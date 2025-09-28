import express from 'express';
import logger from './config/logger.js';

const app = express();

app.get('/', (req, res) => {
  logger.info('Root endpoint was called, Hello from My API!');
  res.status(200).send('Hello, from My APi!');
});

export default app;
