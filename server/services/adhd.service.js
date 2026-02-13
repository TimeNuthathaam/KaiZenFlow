/**
 * ADHD Executive Function Engine Service
 *
 * Business logic layer สำหรับ KaiZen Flow + OpenClaw integration
 * ให้ AI Agent (OpenClaw) เข้าถึง ADHD-specific features ผ่าน MCP/API
 */

import pool from '../db.js';
import { broadcast } from './sse.js';

// ==========================================
// Constants
// ==========================================
const GUARD_RAIL_EMERGENCY_HOUR = 16; // 4 PM
const GUARD_RAIL_HARD_STOP_HOUR = 21; // 9 PM
const DEFAULT_AVAILABLE_MINUTES = 480; // 8 hours

// Energy suggestions by hour (ADHD-optimized)
const ENERGY_BY_HOUR = {
    6: 'medium', 7: 'medium', 8: 'high', 9: 'high', 10: 'high', 11: 'high',
    12: 'medium', 13: 'low', 14: 'medium', 15: 'medium', 16: 'medium',
    17: 'low', 18: 'low', 19: 'low', 20: 'low', 21: 'low', 22: 'low',
};

// ==========================================
// GET ADHD STATE - Main context for OpenClaw
// ==========================================
export async function getADHDState() {
    const now = new Date();
    const currentHour = now.getHours();
    const today = now.toISOString().split('T')[0];

    // Get current sprint
    const [sprints] = await pool.query(
        'SELECT * FROM kaizen_sprints WHERE is_active = TRUE LIMIT 1'
    );
    const currentSprint = sprints[0] || null;
    let elapsedSeconds = 0;
    if (currentSprint) {
        elapsedSeconds = Math.floor((now - new Date(currentSprint.started_at)) / 1000);
    }

    // Get today's summary
    const [todayLogs] = await pool.query(`
        SELECT
            COUNT(*) as sprints_count,
            SUM(duration_seconds) as total_seconds,
            GROUP_CONCAT(mood) as moods
        FROM kaizen_logs
        WHERE DATE(created_at) = ?
    `, [today]);

    const [completedToday] = await pool.query(`
        SELECT COUNT(*) as count FROM kaizen_tasks
        WHERE is_completed = TRUE AND DATE(updated_at) = ?
    `, [today]);

    const [remainingTasks] = await pool.query(`
        SELECT COUNT(*) as count FROM kaizen_tasks
        WHERE is_completed = FALSE
    `);

    // Get streaks
    const [streaks] = await pool.query('SELECT * FROM adhd_streaks');
    const streaksMap = {};
    for (const s of streaks) {
        streaksMap[s.streak_type] = {
            current: s.current_count,
            longest: s.longest_count,
            last_date: s.last_activity_date
        };
    }

    // Get pending tasks by bucket
    const [pendingByBucket] = await pool.query(`
        SELECT
            bucket,
            COUNT(*) as count,
            SUM(CASE WHEN source = 'parking_lot' THEN 1 ELSE 0 END) as parking_lot_count
        FROM kaizen_tasks
        WHERE is_completed = FALSE
        GROUP BY bucket
    `);

    // Get daily highlight
    const [highlight] = await pool.query(`
        SELECT id, title FROM kaizen_tasks
        WHERE is_daily_highlight = TRUE AND is_completed = FALSE
        LIMIT 1
    `);

    // Count urgent tasks
    const urgentCount = pendingByBucket.find(b => b.bucket === 'urgent')?.count || 0;
    const deadlineCount = pendingByBucket.find(b => b.bucket === 'deadline')?.count || 0;
    const parkingLotCount = pendingByBucket.reduce((sum, b) => sum + (b.parking_lot_count || 0), 0);

    // Determine dominant mood
    const moods = (todayLogs[0]?.moods || '').split(',').filter(Boolean);
    const moodCounts = { flow: 0, okay: 0, drained: 0 };
    moods.forEach(m => moodCounts[m]++);
    const dominantMood = Object.entries(moodCounts)
        .filter(([_, c]) => c > 0)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Guard rails check
    const isGuardRailTime = currentHour >= GUARD_RAIL_EMERGENCY_HOUR;
    let guardRailType = null;
    if (currentHour >= GUARD_RAIL_HARD_STOP_HOUR) {
        guardRailType = 'hard_stop_9pm';
    } else if (currentHour >= GUARD_RAIL_EMERGENCY_HOUR) {
        guardRailType = 'emergency_4pm';
    }

    // Generate recommendations
    const recommendations = generateRecommendations({
        currentSprint,
        urgentCount,
        parkingLotCount,
        dominantMood,
        sprintsCount: todayLogs[0]?.sprints_count || 0,
        isGuardRailTime,
        currentHour
    });

    return {
        current_sprint: currentSprint ? {
            id: currentSprint.id,
            bucket: currentSprint.bucket,
            elapsed_seconds: elapsedSeconds,
            started_at: currentSprint.started_at,
            goal: currentSprint.goal || null
        } : null,

        energy_profile: {
            current_hour: currentHour,
            suggested_energy: ENERGY_BY_HOUR[currentHour] || 'medium',
            is_guard_rail_time: isGuardRailTime,
            guard_rail_type: guardRailType
        },

        today_summary: {
            tasks_completed: completedToday[0]?.count || 0,
            tasks_remaining: remainingTasks[0]?.count || 0,
            time_spent_seconds: todayLogs[0]?.total_seconds || 0,
            dominant_mood: dominantMood,
            sprints_count: todayLogs[0]?.sprints_count || 0
        },

        streaks: {
            daily_plan: streaksMap.daily_plan?.current || 0,
            morning_activation: streaksMap.morning_activation?.current || 0,
            sprint_complete: streaksMap.sprint_complete?.current || 0
        },

        pending_tasks: {
            urgent_count: urgentCount,
            deadline_count: deadlineCount,
            parking_lot_count: parkingLotCount,
            daily_highlight: highlight[0] || null
        },

        recommendations
    };
}

// ==========================================
// PLAN DAY - Morning Activation
// ==========================================
export async function planDay({ goals = [], available_minutes, energy_profile = 'medium', must_do_task_ids = [] }) {
    const today = new Date().toISOString().split('T')[0];
    const totalMinutes = available_minutes || DEFAULT_AVAILABLE_MINUTES;

    // Get all incomplete tasks
    const [tasks] = await pool.query(`
        SELECT * FROM kaizen_tasks
        WHERE is_completed = FALSE
        ORDER BY
            CASE bucket WHEN 'urgent' THEN 1 WHEN 'deadline' THEN 2 WHEN 'admin' THEN 3 WHEN 'creative' THEN 4 ELSE 5 END,
            CASE priority_type WHEN 'fire' THEN 1 WHEN 'bolt' THEN 2 WHEN 'turtle' THEN 3 ELSE 4 END,
            COALESCE(dopamine_score, 1) DESC,
            sort_order ASC
    `);

    // Build time blocks based on energy
    const blocks = buildTimeBlocks(tasks, energy_profile, totalMinutes, must_do_task_ids);

    // Calculate totals
    const totalPlannedMinutes = blocks.reduce((sum, b) => sum + b.total_minutes, 0);
    const bufferMinutes = Math.max(0, totalMinutes - totalPlannedMinutes);

    // Generate warnings
    const warnings = [];
    if (totalPlannedMinutes > totalMinutes) {
        warnings.push(`Over-scheduled by ${totalPlannedMinutes - totalMinutes} minutes. Consider removing some tasks.`);
    }
    if (tasks.filter(t => t.bucket === 'urgent').length > 5) {
        warnings.push('You have many urgent tasks. Focus on top 3 first.');
    }

    // Generate ADHD-friendly tips
    const tips = [
        'Start with a quick win (5-15 min task) to build momentum',
        'Take breaks every 45-60 minutes',
        'Use the parking lot for random thoughts'
    ];

    // Save plan to database
    const [result] = await pool.query(`
        INSERT INTO adhd_daily_plans (plan_date, morning_energy, total_available_minutes, planned_tasks, goals)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            morning_energy = VALUES(morning_energy),
            total_available_minutes = VALUES(total_available_minutes),
            planned_tasks = VALUES(planned_tasks),
            goals = VALUES(goals),
            updated_at = NOW()
    `, [
        today,
        energy_profile,
        totalMinutes,
        JSON.stringify(blocks.flatMap(b => b.tasks.map(t => t.id))),
        JSON.stringify(goals)
    ]);

    // Update streak
    await updateStreak('daily_plan');
    await updateStreak('morning_activation');

    broadcast('daily_plan_created', { plan_date: today, blocks_count: blocks.length });

    return {
        plan_id: result.insertId || 0,
        plan_date: today,
        scheduled_blocks: blocks,
        total_planned_minutes: totalPlannedMinutes,
        buffer_minutes: bufferMinutes,
        warnings,
        tips
    };
}

// ==========================================
// LOG DISTRACTION
// ==========================================
export async function logDistraction({ source, description = '', capture_as_task = false, task_title = '' }) {
    // Get current sprint
    const [sprints] = await pool.query(
        'SELECT * FROM kaizen_sprints WHERE is_active = TRUE LIMIT 1'
    );
    const currentSprint = sprints[0] || null;

    let capturedTaskId = null;
    let capturedTask = null;

    // Optionally create task from distraction
    if (capture_as_task) {
        const title = task_title || description || 'Captured thought';
        const [result] = await pool.query(`
            INSERT INTO kaizen_tasks (title, bucket, source, priority_type)
            VALUES (?, 'unsorted', 'parking_lot', 'turtle')
        `, [title]);
        capturedTaskId = result.insertId;
        capturedTask = { id: capturedTaskId, title };
        broadcast('task_created', capturedTask);
    }

    // Log distraction
    const [result] = await pool.query(`
        INSERT INTO adhd_distractions (source, description, captured_task_id, sprint_id)
        VALUES (?, ?, ?, ?)
    `, [source, description, capturedTaskId, currentSprint?.id || null]);

    // Get current task for reminder
    let focusReminder = '';
    if (currentSprint) {
        const [currentTasks] = await pool.query(`
            SELECT title FROM kaizen_tasks
            WHERE bucket = ? AND is_completed = FALSE
            ORDER BY sort_order ASC LIMIT 1
        `, [currentSprint.bucket]);
        if (currentTasks[0]) {
            focusReminder = `You were working on: ${currentTasks[0].title}`;
        } else {
            focusReminder = `You were in ${currentSprint.bucket} sprint`;
        }
    }

    broadcast('distraction_logged', { source, has_task: capture_as_task });

    return {
        distraction_id: result.insertId,
        captured_task: capturedTask,
        encouragement: getEncouragement(),
        focus_reminder: focusReminder
    };
}

// ==========================================
// SUMMARIZE (today/week)
// ==========================================
export async function summarize(period = 'today') {
    let dateFilter;
    const now = new Date();

    switch (period) {
        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            dateFilter = `DATE(created_at) = '${yesterday.toISOString().split('T')[0]}'`;
            break;
        case 'week':
            dateFilter = `created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
            break;
        case 'month':
            dateFilter = `created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
            break;
        default: // today
            dateFilter = `DATE(created_at) = '${now.toISOString().split('T')[0]}'`;
    }

    // Productivity metrics
    const [logs] = await pool.query(`
        SELECT
            COUNT(*) as sprints_count,
            SUM(duration_seconds) as total_focus_seconds,
            SUM(CASE WHEN mood = 'flow' THEN 1 ELSE 0 END) as flow_count,
            SUM(CASE WHEN mood = 'drained' THEN 1 ELSE 0 END) as drained_count,
            AVG(duration_seconds) as avg_session_seconds
        FROM kaizen_logs
        WHERE ${dateFilter}
    `);

    // Tasks completed
    const [tasks] = await pool.query(`
        SELECT COUNT(*) as completed FROM kaizen_tasks
        WHERE is_completed = TRUE AND ${dateFilter.replace('created_at', 'updated_at')}
    `);

    // Bucket distribution
    const [buckets] = await pool.query(`
        SELECT bucket, COUNT(*) as count, SUM(duration_seconds) as total_seconds
        FROM kaizen_logs
        WHERE ${dateFilter}
        GROUP BY bucket
        ORDER BY total_seconds DESC
    `);

    // Distractions
    const [distractions] = await pool.query(`
        SELECT source, COUNT(*) as count
        FROM adhd_distractions
        WHERE ${dateFilter}
        GROUP BY source
        ORDER BY count DESC
    `);

    // Estimation accuracy (actual vs estimated)
    const [estimation] = await pool.query(`
        SELECT
            AVG(CASE WHEN estimated_seconds > 0 THEN duration_seconds / estimated_seconds ELSE NULL END) as avg_ratio
        FROM kaizen_logs
        WHERE ${dateFilter} AND estimated_seconds > 0
    `);

    const mostProductiveBucket = buckets[0]?.bucket || 'N/A';

    // Generate insights
    const insights = [];
    const recommendations = [];

    if (logs[0]?.flow_count >= 3) {
        insights.push(`Great job! You had ${logs[0].flow_count} flow sessions.`);
    }
    if (logs[0]?.drained_count >= 2) {
        insights.push(`You felt drained ${logs[0].drained_count} times. Consider more breaks.`);
        recommendations.push('Add 10-minute breaks between sessions');
    }
    if (buckets.length > 0) {
        insights.push(`Most productive bucket: ${mostProductiveBucket}`);
    }
    if (estimation[0]?.avg_ratio > 1.2) {
        insights.push('You tend to underestimate task duration.');
        recommendations.push('Try adding 20% buffer to your estimates');
    }

    return {
        period,
        productivity: {
            total_focus_time_seconds: logs[0]?.total_focus_seconds || 0,
            total_tasks_completed: tasks[0]?.completed || 0,
            flow_sessions: logs[0]?.flow_count || 0,
            drained_sessions: logs[0]?.drained_count || 0
        },
        patterns: {
            most_productive_bucket: mostProductiveBucket,
            peak_focus_hour: 10, // Could be calculated from data
            average_session_length: Math.round(logs[0]?.avg_session_seconds || 0),
            distraction_count: distractions.reduce((sum, d) => sum + d.count, 0),
            top_distraction_sources: distractions.slice(0, 3)
        },
        estimation_accuracy: {
            average_ratio: Math.round((estimation[0]?.avg_ratio || 1) * 100) / 100,
            improvement_trend: 'stable' // Could be calculated from historical data
        },
        insights,
        recommendations
    };
}

// ==========================================
// FOCUS RECOMMENDATION
// ==========================================
export async function getFocusRecommendation({ energy, available_minutes } = {}) {
    const currentHour = new Date().getHours();
    const suggestedEnergy = energy || ENERGY_BY_HOUR[currentHour] || 'medium';

    // Check if currently in sprint
    const [sprints] = await pool.query(
        'SELECT * FROM kaizen_sprints WHERE is_active = TRUE LIMIT 1'
    );
    if (sprints[0]) {
        return {
            recommended_action: 'continue_sprint',
            reasoning: `You're already in a sprint! Stay focused on ${sprints[0].bucket}.`,
            current_sprint: sprints[0],
            alternative_actions: ['Take a quick 5-minute break', 'Log a distraction if needed']
        };
    }

    // Check guard rails
    if (currentHour >= GUARD_RAIL_HARD_STOP_HOUR) {
        return {
            recommended_action: 'take_break',
            reasoning: "It's past 9 PM. Time to wind down for better sleep!",
            alternative_actions: ['Review tomorrow\'s plan', 'Do a quick brain dump for peace of mind']
        };
    }

    // Get tasks sorted by relevance
    const [tasks] = await pool.query(`
        SELECT * FROM kaizen_tasks
        WHERE is_completed = FALSE
        ORDER BY
            CASE bucket WHEN 'urgent' THEN 1 WHEN 'deadline' THEN 2 ELSE 3 END,
            CASE WHEN energy_level = ? THEN 0 ELSE 1 END,
            CASE WHEN friction_level = 'low' THEN 0 WHEN friction_level = 'medium' THEN 1 ELSE 2 END,
            COALESCE(dopamine_score, 1) DESC
        LIMIT 5
    `, [suggestedEnergy]);

    if (tasks.length === 0) {
        return {
            recommended_action: 'review_parking_lot',
            reasoning: 'No pending tasks! Check your parking lot for captured ideas.',
            alternative_actions: ['Plan tomorrow', 'Take a well-deserved break']
        };
    }

    // Determine best bucket
    const bucketCounts = {};
    tasks.forEach(t => {
        bucketCounts[t.bucket] = (bucketCounts[t.bucket] || 0) + 1;
    });
    const suggestedBucket = Object.entries(bucketCounts)
        .sort(([, a], [, b]) => b - a)[0][0];

    // Build suggestion
    const suggestedTasks = tasks.filter(t => t.bucket === suggestedBucket).slice(0, 3);
    const estimatedMinutes = suggestedTasks.reduce((sum, t) => sum + (t.estimated_duration || 25), 0);

    return {
        recommended_action: 'start_sprint',
        if_start_sprint: {
            suggested_bucket: suggestedBucket,
            suggested_tasks: suggestedTasks.map(t => ({
                id: t.id,
                title: t.title,
                estimated_duration: t.estimated_duration || 25,
                reason: getTaskReason(t)
            })),
            estimated_total_minutes: estimatedMinutes
        },
        reasoning: `Based on your energy level (${suggestedEnergy}) and pending tasks.`,
        alternative_actions: ['Pick a different bucket', 'Take a 5-minute break first']
    };
}

// ==========================================
// START STRUCTURED SPRINT
// ==========================================
export async function startStructuredSprint({ bucket, task_ids = [], target_minutes = 45, goal = '' }) {
    // Stop any active sprint first
    await pool.query(`
        UPDATE kaizen_sprints
        SET is_active = FALSE,
            ended_at = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW())
        WHERE is_active = TRUE
    `);

    // Auto-select tasks if not provided
    let selectedTasks = [];
    if (task_ids.length === 0) {
        const [tasks] = await pool.query(`
            SELECT * FROM kaizen_tasks
            WHERE bucket = ? AND is_completed = FALSE
            ORDER BY
                CASE priority_type WHEN 'fire' THEN 1 WHEN 'bolt' THEN 2 ELSE 3 END,
                friction_level = 'low' DESC,
                COALESCE(dopamine_score, 1) DESC
            LIMIT 5
        `, [bucket]);
        selectedTasks = tasks;
    } else {
        const [tasks] = await pool.query(`
            SELECT * FROM kaizen_tasks WHERE id IN (?)
        `, [task_ids]);
        selectedTasks = tasks;
    }

    // Calculate estimated total
    const estimatedMinutes = selectedTasks.reduce((sum, t) => sum + (t.estimated_duration || 25), 0);

    // Create sprint
    const [result] = await pool.query(`
        INSERT INTO kaizen_sprints (bucket, estimated_total_minutes, goal, planned_task_ids)
        VALUES (?, ?, ?, ?)
    `, [bucket, estimatedMinutes, goal, JSON.stringify(selectedTasks.map(t => t.id))]);

    const sprint = {
        id: result.insertId,
        bucket,
        started_at: new Date().toISOString(),
        is_active: true,
        goal,
        estimated_total_minutes: estimatedMinutes,
        target_minutes,
        selected_tasks: selectedTasks.map(t => ({
            id: t.id,
            title: t.title,
            estimated_duration: t.estimated_duration
        }))
    };

    broadcast('sprint_started', sprint);

    return sprint;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function generateRecommendations({ currentSprint, urgentCount, parkingLotCount, dominantMood, sprintsCount, isGuardRailTime, currentHour }) {
    const recs = [];

    if (currentSprint) {
        recs.push('Stay focused on your current sprint!');
    } else if (urgentCount > 0) {
        recs.push(`You have ${urgentCount} urgent task(s). Consider starting there.`);
    } else if (sprintsCount === 0) {
        recs.push('Start your day with a quick win - pick something easy!');
    }

    if (parkingLotCount > 5) {
        recs.push('Your parking lot is filling up. Review and process some items.');
    }

    if (dominantMood === 'drained') {
        recs.push('You seem tired. Take a break or switch to low-energy tasks.');
    }

    if (isGuardRailTime && currentHour < GUARD_RAIL_HARD_STOP_HOUR) {
        recs.push('Guard rail: Start wrapping up for the day.');
    }

    if (recs.length === 0) {
        recs.push('Looking good! Keep up the momentum.');
    }

    return recs;
}

function buildTimeBlocks(tasks, energyProfile, totalMinutes, mustDoIds) {
    const blocks = [];
    let remainingMinutes = totalMinutes;

    // Prioritize must-do tasks
    const mustDoTasks = tasks.filter(t => mustDoIds.includes(t.id));
    const otherTasks = tasks.filter(t => !mustDoIds.includes(t.id));

    // Morning block (high energy)
    const morningTasks = [...mustDoTasks, ...otherTasks.filter(t =>
        t.energy_level === 'high' || t.bucket === 'urgent' || t.priority_type === 'fire'
    )].slice(0, 3);

    if (morningTasks.length > 0) {
        const blockMinutes = morningTasks.reduce((sum, t) => sum + (t.estimated_duration || 25), 0);
        blocks.push({
            time_slot: '09:00-12:00',
            bucket: morningTasks[0].bucket,
            tasks: morningTasks.map(t => ({
                id: t.id,
                title: t.title,
                estimated_duration: t.estimated_duration || 25,
                priority_type: t.priority_type
            })),
            total_minutes: blockMinutes
        });
        remainingMinutes -= blockMinutes;
    }

    // Afternoon block (medium energy - admin)
    const afternoonTasks = otherTasks.filter(t =>
        !morningTasks.includes(t) && (t.bucket === 'admin' || t.energy_level === 'medium')
    ).slice(0, 3);

    if (afternoonTasks.length > 0) {
        const blockMinutes = afternoonTasks.reduce((sum, t) => sum + (t.estimated_duration || 25), 0);
        blocks.push({
            time_slot: '14:00-16:00',
            bucket: 'admin',
            tasks: afternoonTasks.map(t => ({
                id: t.id,
                title: t.title,
                estimated_duration: t.estimated_duration || 25,
                priority_type: t.priority_type
            })),
            total_minutes: blockMinutes
        });
        remainingMinutes -= blockMinutes;
    }

    // Evening block (low energy - creative/light)
    if (energyProfile !== 'low') {
        const eveningTasks = otherTasks.filter(t =>
            !morningTasks.includes(t) && !afternoonTasks.includes(t) &&
            (t.bucket === 'creative' || t.energy_level === 'low' || t.friction_level === 'low')
        ).slice(0, 2);

        if (eveningTasks.length > 0) {
            const blockMinutes = eveningTasks.reduce((sum, t) => sum + (t.estimated_duration || 25), 0);
            blocks.push({
                time_slot: '16:00-18:00',
                bucket: 'creative',
                tasks: eveningTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    estimated_duration: t.estimated_duration || 25,
                    priority_type: t.priority_type
                })),
                total_minutes: blockMinutes
            });
        }
    }

    return blocks;
}

function getTaskReason(task) {
    if (task.priority_type === 'fire') return 'Urgent priority';
    if (task.priority_type === 'bolt') return 'Quick win to build momentum';
    if (task.friction_level === 'low') return 'Easy to start';
    if (task.dopamine_score >= 2) return 'Engaging task';
    if (task.bucket === 'urgent') return 'Time-sensitive';
    return 'Matches your energy level';
}

function getEncouragement() {
    const messages = [
        'Good catch! Now back to focus.',
        'Noted! Your brain will thank you later.',
        "Distraction captured. You've got this!",
        'Parking lot updated. Stay on track!',
        'Smart move logging that. Back to work!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

async function updateStreak(streakType) {
    const today = new Date().toISOString().split('T')[0];

    const [current] = await pool.query(
        'SELECT * FROM adhd_streaks WHERE streak_type = ?',
        [streakType]
    );

    if (current.length === 0) {
        await pool.query(`
            INSERT INTO adhd_streaks (streak_type, current_count, longest_count, last_activity_date)
            VALUES (?, 1, 1, ?)
        `, [streakType, today]);
        return;
    }

    const streak = current[0];
    const lastDate = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
    const todayDate = new Date(today);

    let newCount = streak.current_count;

    if (!lastDate || todayDate.toDateString() !== lastDate.toDateString()) {
        // Check if consecutive day
        if (lastDate) {
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                newCount = streak.current_count + 1;
            } else if (diffDays > 1) {
                newCount = 1; // Reset streak
            }
        } else {
            newCount = 1;
        }

        const newLongest = Math.max(newCount, streak.longest_count);

        await pool.query(`
            UPDATE adhd_streaks
            SET current_count = ?, longest_count = ?, last_activity_date = ?
            WHERE streak_type = ?
        `, [newCount, newLongest, today, streakType]);
    }
}

export default {
    getADHDState,
    planDay,
    logDistraction,
    summarize,
    getFocusRecommendation,
    startStructuredSprint
};
