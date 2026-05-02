export interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

export interface ScheduleResult {
  selectedTasks: Vehicle[];
  totalDuration: number;
  totalImpact: number;
}

// 0/1 knapsack, O(n * W)
export function optimizeSchedule(vehicles: Vehicle[], budget: number): ScheduleResult {
  const n = vehicles.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(budget + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = vehicles[i - 1];
    for (let w = 0; w <= budget; w++) {
      dp[i][w] = dp[i - 1][w];
      if (w >= Duration && dp[i - 1][w - Duration] + Impact > dp[i][w]) {
        dp[i][w] = dp[i - 1][w - Duration] + Impact;
      }
    }
  }

  const selected: boolean[] = new Array(n).fill(false);
  let remaining = budget;

  for (let i = n; i >= 1; i--) {
    if (dp[i][remaining] !== dp[i - 1][remaining]) {
      selected[i - 1] = true;
      remaining -= vehicles[i - 1].Duration;
    }
  }

  const selectedTasks = vehicles.filter((_, idx) => selected[idx]);
  const totalDuration = selectedTasks.reduce((sum, v) => sum + v.Duration, 0);
  const totalImpact = selectedTasks.reduce((sum, v) => sum + v.Impact, 0);

  return { selectedTasks, totalDuration, totalImpact };
}
