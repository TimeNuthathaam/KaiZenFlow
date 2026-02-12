/**
 * KaiZen Flow MCP Server
 * 
 * Streamable HTTP transport — ให้ AI agents เข้าถึงผ่าน HTTP
 * Endpoint: /mcp (routed via nginx)
 * 
 * Tools: 10 functions สำหรับจัดการ tasks, sprints, kaizen logs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import pool from './db.js';

// Create MCP Server instance
const mcpServer = new McpServer({
    name: 'kaizen-flow',
    version: '1.0.0',
});

// ==========================================
// Tool 1: list_tasks
// ==========================================
mcpServer.tool(
    'list_tasks',
    'ดึงรายการ tasks ทั้งหมด สามารถ filter ตาม bucket และสถานะ completed',
    {
        bucket: z.enum(['unsorted', 'urgent', 'deadline', 'admin', 'creative']).optional().describe('Filter by bucket'),
        show_completed: z.boolean().optional().default(false).describe('รวม tasks ที่ completed แล้ว'),
    },
    async ({ bucket, show_completed }) => {
        let query = 'SELECT * FROM kaizen_tasks';
        const conditions = [];
        const params = [];

        if (bucket) {
            conditions.push('bucket = ?');
            params.push(bucket);
        }
        if (!show_completed) {
            conditions.push('is_completed = FALSE');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY sort_order ASC, created_at DESC';

        const [rows] = await pool.query(query, params);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(rows, null, 2),
            }],
        };
    }
);

// ==========================================
// Tool 2: create_task
// ==========================================
mcpServer.tool(
    'create_task',
    'สร้าง task ใหม่ กำหนด title และ bucket ได้',
    {
        title: z.string().describe('ชื่อ task'),
        bucket: z.enum(['unsorted', 'urgent', 'deadline', 'admin', 'creative']).optional().default('unsorted').describe('Bucket category'),
    },
    async ({ title, bucket }) => {
        const [result] = await pool.query(
            'INSERT INTO kaizen_tasks (title, bucket) VALUES (?, ?)',
            [title.trim(), bucket]
        );
        const [newTask] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [result.insertId]);

        // Broadcast SSE
        const { broadcast } = await import('./services/sse.js');
        broadcast('task_created', newTask[0]);

        return {
            content: [{
                type: 'text',
                text: `✅ Task created: "${title}" in [${bucket}] (ID: ${result.insertId})`,
            }],
        };
    }
);

// ==========================================
// Tool 3: update_task
// ==========================================
mcpServer.tool(
    'update_task',
    'แก้ไข task — เปลี่ยน title, bucket, highlight, หรือ sort_order',
    {
        id: z.number().describe('Task ID'),
        title: z.string().optional().describe('ชื่อใหม่'),
        bucket: z.enum(['unsorted', 'urgent', 'deadline', 'admin', 'creative']).optional().describe('Bucket ใหม่'),
        is_daily_highlight: z.boolean().optional().describe('ตั้งเป็น Daily Highlight'),
        sort_order: z.number().optional().describe('ลำดับการแสดงผล'),
    },
    async ({ id, title, bucket, is_daily_highlight, sort_order }) => {
        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title.trim()); }
        if (bucket !== undefined) { updates.push('bucket = ?'); values.push(bucket); }
        if (is_daily_highlight !== undefined) {
            if (is_daily_highlight) {
                await pool.query('UPDATE kaizen_tasks SET is_daily_highlight = FALSE WHERE is_daily_highlight = TRUE');
            }
            updates.push('is_daily_highlight = ?'); values.push(is_daily_highlight);
        }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }

        if (updates.length === 0) {
            return { content: [{ type: 'text', text: '⚠️ ไม่มีฟิลด์ที่ต้องอัพเดท' }] };
        }

        values.push(id);
        await pool.query(`UPDATE kaizen_tasks SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updatedTask] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [id]);
        if (updatedTask.length === 0) {
            return { content: [{ type: 'text', text: `❌ Task ID ${id} not found` }], isError: true };
        }

        const { broadcast } = await import('./services/sse.js');
        broadcast('task_updated', updatedTask[0]);

        return {
            content: [{
                type: 'text',
                text: `✅ Task #${id} updated: ${JSON.stringify(updatedTask[0], null, 2)}`,
            }],
        };
    }
);

// ==========================================
// Tool 4: complete_task
// ==========================================
mcpServer.tool(
    'complete_task',
    'Mark task เป็น completed หรือ uncomplete',
    {
        id: z.number().describe('Task ID'),
        is_completed: z.boolean().optional().default(true).describe('true = completed, false = uncomplete'),
    },
    async ({ id, is_completed }) => {
        await pool.query('UPDATE kaizen_tasks SET is_completed = ? WHERE id = ?', [is_completed, id]);

        const [task] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [id]);
        if (task.length === 0) {
            return { content: [{ type: 'text', text: `❌ Task ID ${id} not found` }], isError: true };
        }

        const { broadcast } = await import('./services/sse.js');
        broadcast('task_updated', task[0]);

        return {
            content: [{
                type: 'text',
                text: is_completed
                    ? `✅ Task #${id} "${task[0].title}" completed!`
                    : `↩️ Task #${id} "${task[0].title}" uncompleted`,
            }],
        };
    }
);

// ==========================================
// Tool 5: delete_task
// ==========================================
mcpServer.tool(
    'delete_task',
    'ลบ task ออกจากระบบ',
    {
        id: z.number().describe('Task ID'),
    },
    async ({ id }) => {
        const [task] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [id]);
        if (task.length === 0) {
            return { content: [{ type: 'text', text: `❌ Task ID ${id} not found` }], isError: true };
        }

        await pool.query('DELETE FROM kaizen_tasks WHERE id = ?', [id]);

        const { broadcast } = await import('./services/sse.js');
        broadcast('task_deleted', { id });

        return {
            content: [{
                type: 'text',
                text: `🗑️ Task #${id} "${task[0].title}" deleted`,
            }],
        };
    }
);

// ==========================================
// Tool 6: start_sprint
// ==========================================
mcpServer.tool(
    'start_sprint',
    'เริ่ม sprint สำหรับ bucket ที่ระบุ (จะหยุด sprint ก่อนหน้าอัตโนมัติ)',
    {
        bucket: z.string().describe('Bucket ที่จะ sprint เช่น urgent, creative'),
    },
    async ({ bucket }) => {
        // End active sprints
        await pool.query(`
            UPDATE kaizen_sprints SET is_active = FALSE, 
                ended_at = CURRENT_TIMESTAMP,
                duration_seconds = TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP)
            WHERE is_active = TRUE
        `);

        const [result] = await pool.query(
            'INSERT INTO kaizen_sprints (bucket, is_active) VALUES (?, TRUE)',
            [bucket]
        );

        const [sprint] = await pool.query('SELECT * FROM kaizen_sprints WHERE id = ?', [result.insertId]);

        const { broadcast } = await import('./services/sse.js');
        broadcast('sprint_started', sprint[0]);

        return {
            content: [{
                type: 'text',
                text: `🏃 Sprint started for [${bucket}] (ID: ${result.insertId})`,
            }],
        };
    }
);

// ==========================================
// Tool 7: stop_sprint
// ==========================================
mcpServer.tool(
    'stop_sprint',
    'หยุด sprint ที่กำลังทำงานอยู่',
    {},
    async () => {
        const [active] = await pool.query('SELECT * FROM kaizen_sprints WHERE is_active = TRUE LIMIT 1');

        if (active.length === 0) {
            return { content: [{ type: 'text', text: '⚠️ ไม่มี sprint ที่กำลังทำงาน' }] };
        }

        const sprintId = active[0].id;
        await pool.query(`
            UPDATE kaizen_sprints SET is_active = FALSE, 
                ended_at = CURRENT_TIMESTAMP,
                duration_seconds = TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP)
            WHERE id = ?
        `, [sprintId]);

        const [stopped] = await pool.query('SELECT * FROM kaizen_sprints WHERE id = ?', [sprintId]);

        const { broadcast } = await import('./services/sse.js');
        broadcast('sprint_stopped', stopped[0]);

        return {
            content: [{
                type: 'text',
                text: `⏹️ Sprint #${sprintId} stopped (${stopped[0].duration_seconds}s in [${stopped[0].bucket}])`,
            }],
        };
    }
);

// ==========================================
// Tool 8: get_active_sprint
// ==========================================
mcpServer.tool(
    'get_active_sprint',
    'ดู sprint ที่กำลังทำงานอยู่ (ถ้ามี)',
    {},
    async () => {
        const [rows] = await pool.query('SELECT * FROM kaizen_sprints WHERE is_active = TRUE ORDER BY started_at DESC LIMIT 1');

        if (rows.length === 0) {
            return { content: [{ type: 'text', text: 'ไม่มี sprint ที่กำลังทำงาน' }] };
        }

        const sprint = rows[0];
        const elapsed = Math.floor((Date.now() - new Date(sprint.started_at).getTime()) / 1000);

        return {
            content: [{
                type: 'text',
                text: `🏃 Active Sprint: [${sprint.bucket}] — ${elapsed}s elapsed (ID: ${sprint.id})`,
            }],
        };
    }
);

// ==========================================
// Tool 9: create_kaizen_log
// ==========================================
mcpServer.tool(
    'create_kaizen_log',
    'บันทึก kaizen log — mood, duration, notes',
    {
        bucket: z.string().describe('Bucket ที่ทำงาน'),
        mood: z.enum(['flow', 'okay', 'drained']).describe('อารมณ์หลังทำงาน'),
        duration_seconds: z.number().optional().default(0).describe('ระยะเวลาทำงาน (วินาที)'),
        notes: z.string().optional().describe('บันทึกเพิ่มเติม'),
        sprint_id: z.number().optional().describe('Sprint ID ที่เกี่ยวข้อง'),
    },
    async ({ bucket, mood, duration_seconds, notes, sprint_id }) => {
        const [result] = await pool.query(`
            INSERT INTO kaizen_logs (sprint_id, bucket, duration_seconds, mood, notes)
            VALUES (?, ?, ?, ?, ?)
        `, [sprint_id || null, bucket, duration_seconds, mood, notes || null]);

        const [log] = await pool.query('SELECT * FROM kaizen_logs WHERE id = ?', [result.insertId]);

        const { broadcast } = await import('./services/sse.js');
        broadcast('kaizen_log_created', log[0]);

        return {
            content: [{
                type: 'text',
                text: `📝 Kaizen log created: [${bucket}] mood=${mood} (${duration_seconds}s)`,
            }],
        };
    }
);

// ==========================================
// Tool 10: get_health
// ==========================================
mcpServer.tool(
    'get_health',
    'ดูสถานะ server และ database diagnostic',
    {},
    async () => {
        const { isDatabaseReady, getDiagnosticSteps } = await import('./db.js');

        let liveCheck = false;
        try {
            const conn = await pool.getConnection();
            conn.release();
            liveCheck = true;
        } catch (e) { /* */ }

        const result = {
            status: isDatabaseReady() && liveCheck ? 'ok' : 'degraded',
            database: { connected: liveCheck, tables_ready: isDatabaseReady() },
            diagnostics: getDiagnosticSteps(),
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
            }],
        };
    }
);

export default mcpServer;
