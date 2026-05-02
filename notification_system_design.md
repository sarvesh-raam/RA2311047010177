# Notif System Design

## Stage 1
Endpoints:
```
GET /api/notifications - get all (filter by type)
GET /api/notifications/:id - get one
PATCH /api/notifications/:id/read - mark read
POST /api/notifications/read-all - mark all as read
GET /api/notifications/unread-count - get count
```
Real-time: SSE (Server-Sent Events) is better than websockets here since it's only server -> client. simpler to implement.

## Stage 2
DB: Postgres. Relational fits best here. ACID compliant.

Schema:
```
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_notifications (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    notification_id UUID NOT NULL REFERENCES notifications(id),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    UNIQUE(student_id, notification_id)
);
```
Scaling: As data grows, queries will slow down. Solution is table partitioning by student_id and archiving old read notifs.

## Stage 3
Query is slow because of full table scan. No index on (studentID, isRead).
Also SELECT * pulls too much data.

Fix:
```
CREATE INDEX idx_notif_unread ON notifications(student_id, created_at DESC) WHERE is_read = false;

SELECT id, type, message, created_at FROM notifications 
WHERE student_id = 1042 AND is_read = false 
ORDER BY created_at DESC LIMIT 20;
```
Indexing everything is bad - slows down writes. Only index filter columns.

Last 7 days placement notifs:
```
SELECT DISTINCT s.id, s.name FROM students s
JOIN student_notifications sn ON sn.student_id = s.id
JOIN notifications n ON n.id = sn.notification_id
WHERE n.type = 'Placement' AND n.created_at >= NOW() - INTERVAL '7 days';
```

## Stage 4
Solution: Redis cache for unread counts and recent notifs. 
Also use cursor-based pagination (using created_at) instead of OFFSET.
For high load: Add read replicas.

## Stage 5
Problems:
- Loop is slow (sequential)
- No retries if email fails
- Saving to DB + Email should be async

Redesign: Use a message queue for emails. Bulk insert notifs to DB first.

Pseudocode:
```
function notify_all(student_ids, message):
    notif_id = create_notification(message)
    bulk_insert(student_ids, notif_id)
    
    for batch in chunk(student_ids, 500):
        queue.push('send_emails', { batch, message })
```

## Stage 6
Score = typeWeight * 100 + recency (normalized 0-99)
Weights: Placement=3, Result=2, Event=1

Implementation: Use a Min-Heap of size N. If new notif score > heap min, replace it. 
O(log N) for updates, much faster than sorting the whole list.
Code is in notification_app_be/src/priority.ts
