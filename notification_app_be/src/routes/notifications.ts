import { Router, Request, Response } from 'express';
import axios from 'axios';
import { Log } from 'logging-middleware';
import { getTopN, Notification } from '../priority';

const router = Router();
const API_BASE = 'http://20.207.122.201/evaluation-service';

function authHeader() {
  return { Authorization: `Bearer ${process.env.BEARER_TOKEN}` };
}

router.get('/api/notifications', async (req: Request, res: Response) => {
  await Log('backend', 'info', 'route', 'Fetching notifications');

  try {
    const response = await axios.get(`${API_BASE}/notifications`, { headers: authHeader() });
    const notifications: Notification[] = response.data.notifications;

    await Log('backend', 'debug', 'service', `Got ${notifications.length} notifications`);
    res.json({ notifications, total: notifications.length });
  } catch (err: any) {
    await Log('backend', 'error', 'handler', `Notifications fetch failed: ${err.message}`);
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
});

router.get('/api/notifications/priority', async (req: Request, res: Response) => {
  const rawN = parseInt(req.query.n as string, 10);
  const n = rawN > 0 ? rawN : 10;

  await Log('backend', 'info', 'route', `Priority inbox requested, top ${n}`);

  try {
    const response = await axios.get(`${API_BASE}/notifications`, { headers: authHeader() });
    const notifications: Notification[] = response.data.notifications;
    const topNotifications = getTopN(notifications, n);

    await Log('backend', 'info', 'service', `Returning top ${topNotifications.length} of ${notifications.length}`);

    res.json({
      top: n,
      count: topNotifications.length,
      notifications: topNotifications,
    });
  } catch (err: any) {
    await Log('backend', 'error', 'handler', `Priority inbox error: ${err.message}`);
    res.status(500).json({ error: 'Failed to compute priority inbox' });
  }
});

export { router as notificationRouter };
