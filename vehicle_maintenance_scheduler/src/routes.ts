import { Router, Request, Response } from 'express';
import axios from 'axios';
import { Log } from 'logging-middleware';
import { optimizeSchedule, Vehicle } from './knapsack';

const router = Router();
const API_BASE = 'http://20.207.122.201/evaluation-service';

function getAuthHeader() {
  return { Authorization: `Bearer ${process.env.BEARER_TOKEN}` };
}

router.get('/api/schedule', async (req: Request, res: Response) => {
  await Log('backend', 'info', 'route', 'Fetching schedule for all depots');

  try {
    const [depotsRes, vehiclesRes] = await Promise.all([
      axios.get(`${API_BASE}/depots`, { headers: getAuthHeader() }),
      axios.get(`${API_BASE}/vehicles`, { headers: getAuthHeader() }),
    ]);

    const depots: { ID: number; MechanicHours: number }[] = depotsRes.data.depots;
    const vehicles: Vehicle[] = vehiclesRes.data.vehicles;

    await Log('backend', 'debug', 'service', `Got ${depots.length} depots, ${vehicles.length} vehicles`);

    const schedules = depots.map(depot => {
      const result = optimizeSchedule(vehicles, depot.MechanicHours);
      return {
        depotId: depot.ID,
        mechanicHoursAvailable: depot.MechanicHours,
        mechanicHoursUsed: result.totalDuration,
        totalImpactScore: result.totalImpact,
        selectedTasks: result.selectedTasks,
      };
    });

    await Log('backend', 'info', 'service', `Schedules computed for ${depots.length} depots`);
    res.json({ schedules });
  } catch (err: any) {
    await Log('backend', 'error', 'handler', `Schedule fetch failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to compute maintenance schedule' });
  }
});

router.get('/api/schedule/:depotId', async (req: Request, res: Response) => {
  const depotId = parseInt(req.params.depotId, 10);

  if (isNaN(depotId)) {
    await Log('backend', 'warn', 'handler', `Bad depotId: ${req.params.depotId}`);
    res.status(400).json({ error: 'depotId must be a number' });
    return;
  }

  await Log('backend', 'info', 'route', `Schedule request for depot ${depotId}`);

  try {
    const [depotsRes, vehiclesRes] = await Promise.all([
      axios.get(`${API_BASE}/depots`, { headers: getAuthHeader() }),
      axios.get(`${API_BASE}/vehicles`, { headers: getAuthHeader() }),
    ]);

    const depots: { ID: number; MechanicHours: number }[] = depotsRes.data.depots;
    const depot = depots.find(d => d.ID === depotId);

    if (!depot) {
      await Log('backend', 'warn', 'handler', `Depot ${depotId} not found`);
      res.status(404).json({ error: `Depot ${depotId} not found` });
      return;
    }

    const vehicles: Vehicle[] = vehiclesRes.data.vehicles;
    const result = optimizeSchedule(vehicles, depot.MechanicHours);

    await Log('backend', 'info', 'service', `Depot ${depotId}: ${result.selectedTasks.length} tasks, impact=${result.totalImpact}, hours=${result.totalDuration}/${depot.MechanicHours}`);

    res.json({
      depotId: depot.ID,
      mechanicHoursAvailable: depot.MechanicHours,
      mechanicHoursUsed: result.totalDuration,
      totalImpactScore: result.totalImpact,
      selectedTasks: result.selectedTasks,
    });
  } catch (err: any) {
    await Log('backend', 'error', 'handler', `Depot ${depotId} schedule error: ${err.message}`);
    res.status(500).json({ error: 'Failed to compute schedule' });
  }
});

export { router };
