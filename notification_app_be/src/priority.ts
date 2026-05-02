export interface Notification {
  ID: string;
  Type: 'Placement' | 'Result' | 'Event';
  Message: string;
  Timestamp: string;
}

interface ScoredNotification extends Notification {
  priorityScore: number;
}

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

class MinHeap {
  private heap: ScoredNotification[] = [];

  get size() {
    return this.heap.length;
  }

  peek(): ScoredNotification | undefined {
    return this.heap[0];
  }

  push(item: ScoredNotification) {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  pop(): ScoredNotification | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(idx: number) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[idx].priorityScore < this.heap[parent].priorityScore) {
        [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
        idx = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(idx: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < n && this.heap[left].priorityScore < this.heap[smallest].priorityScore) smallest = left;
      if (right < n && this.heap[right].priorityScore < this.heap[smallest].priorityScore) smallest = right;
      if (smallest === idx) break;

      [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
      idx = smallest;
    }
  }

  toSortedArray(): ScoredNotification[] {
    return [...this.heap].sort((a, b) => b.priorityScore - a.priorityScore);
  }
}

function computeScore(notification: Notification, minTs: number, maxTs: number): number {
  const typeWeight = TYPE_WEIGHT[notification.Type] ?? 1;
  const ts = new Date(notification.Timestamp).getTime();
  const recency = maxTs === minTs ? 99 : Math.round(((ts - minTs) / (maxTs - minTs)) * 99);
  return typeWeight * 100 + recency;
}

export function getTopN(notifications: Notification[], n: number): ScoredNotification[] {
  if (notifications.length === 0) return [];

  const timestamps = notifications.map(item => new Date(item.Timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);

  const heap = new MinHeap();

  for (const notif of notifications) {
    const score = computeScore(notif, minTs, maxTs);
    const scored: ScoredNotification = { ...notif, priorityScore: score };

    if (heap.size < n) {
      heap.push(scored);
    } else if (heap.peek() && score > heap.peek()!.priorityScore) {
      heap.pop();
      heap.push(scored);
    }
  }

  return heap.toSortedArray();
}
