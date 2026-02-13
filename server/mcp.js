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
import adhdService from './services/adhd.service.js';

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
    'สร้าง task ใหม่ — กำหนด title, bucket, เวลาประเมิน, พลังงาน, และ priority ได้',
    {
        title: z.string().describe('ชื่อ task'),
        bucket: z.enum(['unsorted', 'urgent', 'deadline', 'admin', 'creative']).optional().default('unsorted').describe('Bucket category'),
        estimated_duration: z.number().optional().describe('เวลาประเมิน (นาที) เช่น 5, 15, 30, 60'),
        energy_level: z.enum(['low', 'medium', 'high']).optional().describe('พลังงานที่ต้องใช้'),
        priority_type: z.enum(['fire', 'bolt', 'turtle']).optional().describe('🔥=ด่วน, ⚡=Quick Win, 🐢=Deep Work'),
        source: z.enum(['manual', 'parking_lot', 'voice', 'mcp']).optional().default('mcp').describe('แหล่งที่มา'),
    },
    async ({ title, bucket, estimated_duration, energy_level, priority_type, source }) => {
        const [result] = await pool.query(
            'INSERT INTO kaizen_tasks (title, bucket, estimated_duration, energy_level, priority_type, source) VALUES (?, ?, ?, ?, ?, ?)',
            [title.trim(), bucket, estimated_duration || null, energy_level || null, priority_type || null, source]
        );
        const [newTask] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [result.insertId]);

        // Broadcast SSE
        const { broadcast } = await import('./services/sse.js');
        broadcast('task_created', newTask[0]);

        return {
            content: [{
                type: 'text',
                text: `✅ Task created: "${title}" in [${bucket}]${estimated_duration ? ` (~${estimated_duration}m)` : ''}${priority_type ? ` ${priority_type}` : ''} (ID: ${result.insertId})`,
            }],
        };
    }
);

// ==========================================
// Tool 3: update_task
// ==========================================
mcpServer.tool(
    'update_task',
    'แก้ไข task — เปลี่ยน title, bucket, highlight, priority, เวลาประเมิน, พลังงาน',
    {
        id: z.number().describe('Task ID'),
        title: z.string().optional().describe('ชื่อใหม่'),
        bucket: z.enum(['unsorted', 'urgent', 'deadline', 'admin', 'creative']).optional().describe('Bucket ใหม่'),
        is_daily_highlight: z.boolean().optional().describe('ตั้งเป็น Daily Highlight'),
        sort_order: z.number().optional().describe('ลำดับการแสดงผล'),
        estimated_duration: z.number().optional().describe('เวลาประเมิน (นาที)'),
        energy_level: z.enum(['low', 'medium', 'high']).optional().describe('พลังงานที่ต้องใช้'),
        priority_type: z.enum(['fire', 'bolt', 'turtle']).optional().describe('🔥⚡🐢 priority'),
    },
    async ({ id, title, bucket, is_daily_highlight, sort_order, estimated_duration, energy_level, priority_type }) => {
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
        if (estimated_duration !== undefined) { updates.push('estimated_duration = ?'); values.push(estimated_duration); }
        if (energy_level !== undefined) { updates.push('energy_level = ?'); values.push(energy_level); }
        if (priority_type !== undefined) { updates.push('priority_type = ?'); values.push(priority_type); }

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

// ==========================================
// OpenClaw Integration Tools (ADHD Executive Function Engine)
// ==========================================

// Tool 11: get_adhd_state
mcpServer.tool(
    'get_adhd_state',
    'Get comprehensive ADHD state — CALL THIS FIRST to understand user context. Returns current sprint, energy profile, today summary, streaks, pending tasks, and AI recommendations.',
    {},
    async () => {
        try {
            const state = await adhdService.getADHDState();
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify(state, null, 2),
                }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Tool 12: plan_day_for_user
mcpServer.tool(
    'plan_day_for_user',
    'Create a daily plan based on goals and energy profile. Best used during morning activation. Returns scheduled time blocks with tasks.',
    {
        goals: z.array(z.string()).max(3).optional().describe('1-3 goals for today (e.g., ["Finish presentation", "Exercise"])'),
        energy_level: z.enum(['low', 'medium', 'high']).optional().describe('Current energy level'),
        available_hours: z.number().min(1).max(12).optional().describe('Hours available for work (default 8)'),
        must_do_task_ids: z.array(z.number()).optional().describe('Task IDs that MUST be done today'),
    },
    async ({ goals, energy_level, available_hours, must_do_task_ids }) => {
        try {
            const plan = await adhdService.planDay({
                goals: goals || [],
                available_minutes: available_hours ? available_hours * 60 : undefined,
                energy_profile: energy_level || 'medium',
                must_do_task_ids: must_do_task_ids || [],
            });

            let response = `📋 Daily Plan Created!\n\n`;
            response += `📅 Date: ${plan.plan_date}\n`;
            response += `⏱️ Total: ${plan.total_planned_minutes}min (${plan.buffer_minutes}min buffer)\n\n`;

            for (const block of plan.scheduled_blocks) {
                response += `🕐 ${block.time_slot} — [${block.bucket}]\n`;
                for (const task of block.tasks) {
                    const icon = task.priority_type === 'fire' ? '🔥' : task.priority_type === 'bolt' ? '⚡' : '🐢';
                    response += `   ${icon} ${task.title} (~${task.estimated_duration}m)\n`;
                }
                response += '\n';
            }

            if (plan.warnings.length > 0) {
                response += `⚠️ Warnings:\n${plan.warnings.map(w => `   - ${w}`).join('\n')}\n\n`;
            }

            response += `💡 Tips:\n${plan.tips.map(t => `   - ${t}`).join('\n')}`;

            return {
                content: [{ type: 'text', text: response }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error creating plan: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Tool 13: start_structured_sprint
mcpServer.tool(
    'start_structured_sprint',
    'Start a focus sprint with smart task selection. More powerful than basic start_sprint — auto-selects best tasks based on energy and priority.',
    {
        bucket: z.enum(['urgent', 'deadline', 'admin', 'creative']).describe('Which bucket to focus on'),
        task_ids: z.array(z.number()).optional().describe('Specific task IDs to include (auto-selects if not provided)'),
        target_minutes: z.number().optional().describe('Target duration in minutes (default 45)'),
        goal: z.string().optional().describe('Sprint goal (e.g., "Clear all urgent emails")'),
    },
    async ({ bucket, task_ids, target_minutes, goal }) => {
        try {
            const sprint = await adhdService.startStructuredSprint({
                bucket,
                task_ids: task_ids || [],
                target_minutes: target_minutes || 45,
                goal: goal || '',
            });

            let response = `🏃 Sprint Started!\n\n`;
            response += `📍 Bucket: ${sprint.bucket}\n`;
            if (sprint.goal) response += `🎯 Goal: ${sprint.goal}\n`;
            response += `⏱️ Target: ${sprint.target_minutes}min\n`;
            response += `📊 Estimated: ${sprint.estimated_total_minutes}min\n\n`;
            response += `📝 Selected Tasks:\n`;

            for (const task of sprint.selected_tasks) {
                response += `   • ${task.title} (~${task.estimated_duration || 25}m)\n`;
            }

            response += `\n💪 Focus mode activated! Stay strong!`;

            return {
                content: [{ type: 'text', text: response }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error starting sprint: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Tool 14: log_distraction
mcpServer.tool(
    'log_distraction',
    'Log a distraction during focus time. Can optionally capture the thought as a parking lot task.',
    {
        source: z.enum(['phone', 'thought', 'person', 'environment', 'internal', 'other']).describe('What caused the distraction'),
        description: z.string().optional().describe('Brief description of the distraction'),
        capture_as_task: z.boolean().optional().default(false).describe('Save as a parking lot task'),
    },
    async ({ source, description, capture_as_task }) => {
        try {
            const result = await adhdService.logDistraction({
                source,
                description: description || '',
                capture_as_task: capture_as_task || false,
                task_title: description || '',
            });

            let response = `📱 Distraction Logged\n\n`;
            response += `Source: ${source}\n`;
            if (description) response += `Note: "${description}"\n`;

            if (result.captured_task) {
                response += `\n🅿️ Captured as task: "${result.captured_task.title}" (ID: ${result.captured_task.id})\n`;
            }

            response += `\n✨ ${result.encouragement}\n`;
            if (result.focus_reminder) {
                response += `\n🎯 ${result.focus_reminder}`;
            }

            return {
                content: [{ type: 'text', text: response }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Tool 15: summarize_today
mcpServer.tool(
    'summarize_today',
    'Get a summary of productivity with patterns and insights. Great for end-of-day review.',
    {
        period: z.enum(['today', 'yesterday', 'week', 'month']).optional().default('today').describe('Time period to summarize'),
    },
    async ({ period }) => {
        try {
            const summary = await adhdService.summarize(period || 'today');

            let response = `📊 ${period.charAt(0).toUpperCase() + period.slice(1)}'s Summary\n\n`;

            // Productivity
            const hours = Math.floor(summary.productivity.total_focus_time_seconds / 3600);
            const mins = Math.floor((summary.productivity.total_focus_time_seconds % 3600) / 60);
            response += `⏱️ Focus Time: ${hours}h ${mins}m\n`;
            response += `✅ Tasks Completed: ${summary.productivity.total_tasks_completed}\n`;
            response += `🔥 Flow Sessions: ${summary.productivity.flow_sessions}\n`;
            response += `😫 Drained Sessions: ${summary.productivity.drained_sessions}\n\n`;

            // Patterns
            response += `📈 Patterns:\n`;
            response += `   Best Bucket: ${summary.patterns.most_productive_bucket}\n`;
            response += `   Avg Session: ${Math.round(summary.patterns.average_session_length / 60)}min\n`;
            response += `   Distractions: ${summary.patterns.distraction_count}\n`;
            if (summary.patterns.top_distraction_sources.length > 0) {
                response += `   Top Source: ${summary.patterns.top_distraction_sources[0].source}\n`;
            }
            response += '\n';

            // Estimation accuracy
            const ratio = summary.estimation_accuracy.average_ratio;
            const accuracyEmoji = ratio > 1.2 ? '⚠️' : ratio < 0.8 ? '🎯' : '✓';
            response += `📐 Estimation: ${accuracyEmoji} ${Math.round(ratio * 100)}% of actual\n\n`;

            // Insights
            if (summary.insights.length > 0) {
                response += `💡 Insights:\n${summary.insights.map(i => `   • ${i}`).join('\n')}\n\n`;
            }

            // Recommendations
            if (summary.recommendations.length > 0) {
                response += `🎯 Recommendations:\n${summary.recommendations.map(r => `   • ${r}`).join('\n')}`;
            }

            return {
                content: [{ type: 'text', text: response }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
                isError: true,
            };
        }
    }
);

// Tool 16: get_focus_recommendation
mcpServer.tool(
    'get_focus_recommendation',
    'Get AI recommendation for what to do next. Uses current state, energy level, and pending tasks.',
    {
        energy: z.enum(['low', 'medium', 'high']).optional().describe('Override auto-detected energy level'),
        available_minutes: z.number().optional().describe('Time available for work'),
    },
    async ({ energy, available_minutes }) => {
        try {
            const rec = await adhdService.getFocusRecommendation({
                energy,
                available_minutes,
            });

            let response = `🎯 Recommendation: ${rec.recommended_action.replace(/_/g, ' ').toUpperCase()}\n\n`;
            response += `💭 ${rec.reasoning}\n\n`;

            if (rec.if_start_sprint) {
                response += `📍 Suggested Sprint: [${rec.if_start_sprint.suggested_bucket}]\n`;
                response += `⏱️ Estimated: ${rec.if_start_sprint.estimated_total_minutes}min\n\n`;
                response += `📝 Tasks:\n`;
                for (const task of rec.if_start_sprint.suggested_tasks) {
                    response += `   • ${task.title} (~${task.estimated_duration}m)\n`;
                    response += `     → ${task.reason}\n`;
                }
                response += '\n';
            }

            if (rec.current_sprint) {
                response += `🏃 Current Sprint: [${rec.current_sprint.bucket}]\n\n`;
            }

            response += `🔄 Alternatives:\n${rec.alternative_actions.map(a => `   • ${a}`).join('\n')}`;

            return {
                content: [{ type: 'text', text: response }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `❌ Error: ${error.message}` }],
                isError: true,
            };
        }
    }
);

export default mcpServer;
