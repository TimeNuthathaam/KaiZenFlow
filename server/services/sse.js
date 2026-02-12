/**
 * SSE (Server-Sent Events) Real-time Broadcast Service
 * 
 * เมื่อ task/sprint ถูกเปลี่ยนแปลง (จาก web หรือ MCP)
 * จะ broadcast event ไปยังทุก connected client → frontend auto-refresh
 */

const clients = new Set();

/**
 * SSE endpoint handler — ให้ frontend subscribe
 * Usage: GET /api/events
 */
export function sseHandler(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    clients.add(res);
    console.log(`[SSE] Client connected (total: ${clients.size})`);

    req.on('close', () => {
        clients.delete(res);
        console.log(`[SSE] Client disconnected (total: ${clients.size})`);
    });
}

/**
 * Broadcast event to all connected clients
 * @param {string} type - Event type: 'task_created', 'task_updated', 'task_deleted', 'sprint_started', 'sprint_stopped', 'kaizen_log_created'
 * @param {object} data - Event payload
 */
export function broadcast(type, data = {}) {
    const event = {
        type,
        data,
        timestamp: new Date().toISOString(),
    };

    const message = `data: ${JSON.stringify(event)}\n\n`;

    for (const client of clients) {
        try {
            client.write(message);
        } catch (e) {
            clients.delete(client);
        }
    }

    if (clients.size > 0) {
        console.log(`[SSE] Broadcast "${type}" to ${clients.size} client(s)`);
    }
}

export default { sseHandler, broadcast };
