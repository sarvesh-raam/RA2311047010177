import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initLogger, Log } from 'logging-middleware';
import { router } from './routes';

dotenv.config();

initLogger({
  email: process.env.LOG_EMAIL!,
  name: process.env.LOG_NAME!,
  rollNo: process.env.LOG_ROLL_NO!,
  accessCode: process.env.LOG_ACCESS_CODE!,
  clientID: process.env.LOG_CLIENT_ID!,
  clientSecret: process.env.LOG_CLIENT_SECRET!,
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(router);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, async () => {
  await Log('backend', 'info', 'config', `Vehicle scheduler running on port ${PORT}`);
});
