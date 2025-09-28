import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './config/logger.js';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.get('/', (req, res) => {
  logger.info('Root endpoint was called, Hello from My API!');
  res.status(200).send('Hello, from My APi!');
});

export default app;
