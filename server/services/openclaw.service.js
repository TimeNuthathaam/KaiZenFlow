/**
 * OpenClaw Webhook Service
 * 
 * ใช้สำหรับส่ง events ไปยัง OpenClaw AI Agent
 * สำหรับ Docker: ใช้ host.docker.internal หรือ 172.17.0.1
 */

// Configuration
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://host.docker.internal:18789/hooks/wake';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

/**
 * Notify OpenClaw with an event
 * @param {string} eventName - ชื่อ event เช่น 'task_completed', 'sprint_started'
 * @param {object} payload - ข้อมูลที่ต้องการส่ง
 * @returns {Promise<boolean>} - true if successful, false if failed
 */
export async function notifyOpenClaw(eventName, payload = {}) {
    // Skip if no token configured
    if (!OPENCLAW_TOKEN) {
        console.warn('[OpenClaw] Warning: OPENCLAW_TOKEN not configured, skipping notification');
        return false;
    }

    try {
        const response = await fetch(OPENCLAW_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
            },
            body: JSON.stringify({
                event: eventName,
                data: payload,
                timestamp: new Date().toISOString(),
                source: 'kaizen-flow',
            }),
        });

        if (!response.ok) {
            console.error(`[OpenClaw] Error: ${response.status} ${response.statusText}`);
            return false;
        }

        console.log(`[OpenClaw] Event "${eventName}" sent successfully`);
        return true;

    } catch (error) {
        // ไม่ให้ crash แอพหลัก ถ้า OpenClaw ล่ม
        console.error(`[OpenClaw] Failed to send event "${eventName}":`, error.message);
        return false;
    }
}

// ===== Convenience Functions =====

/**
 * แจ้ง OpenClaw เมื่อ task ถูก complete
 */
export async function notifyTaskCompleted(task) {
    return notifyOpenClaw('task_completed', {
        taskId: task.id,
        title: task.title,
        bucket: task.bucket,
        isDailyHighlight: task.is_daily_highlight,
    });
}

/**
 * แจ้ง OpenClaw เมื่อเริ่ม Sprint
 */
export async function notifySprintStarted(bucket) {
    return notifyOpenClaw('sprint_started', {
        bucket,
        startedAt: new Date().toISOString(),
    });
}

/**
 * แจ้ง OpenClaw เมื่อจบ Sprint
 */
export async function notifySprintEnded(bucket, durationSeconds, mood) {
    return notifyOpenClaw('sprint_ended', {
        bucket,
        durationSeconds,
        mood,
        endedAt: new Date().toISOString(),
    });
}

/**
 * แจ้ง OpenClaw เมื่อ Guard Rail triggers
 */
export async function notifyGuardRailTriggered(type) {
    return notifyOpenClaw('guard_rail_triggered', {
        type, // 'emergency_4pm' or 'hard_stop_9pm'
        triggeredAt: new Date().toISOString(),
    });
}

export default {
    notifyOpenClaw,
    notifyTaskCompleted,
    notifySprintStarted,
    notifySprintEnded,
    notifyGuardRailTriggered,
};
