/**
 * ADHD API Routes - OpenClaw Integration
 *
 * Executive Function Engine endpoints for AI agents
 * All endpoints require API key authentication
 */

import express from 'express';
import adhdService from '../services/adhd.service.js';

const router = express.Router();

// ==========================================
// GET /api/adhd/state - Current ADHD Context
// ==========================================
/**
 * Get comprehensive ADHD state for AI agent context
 * OpenClaw should call this FIRST to understand user state
 *
 * Response: {
 *   current_sprint, energy_profile, today_summary,
 *   streaks, pending_tasks, recommendations
 * }
 */
router.get('/state', async (req, res) => {
    try {
        const state = await adhdService.getADHDState();
        res.json(state);
    } catch (error) {
        console.error('[ADHD] Error getting state:', error);
        res.status(500).json({
            error: 'Failed to get ADHD state',
            message: error.message
        });
    }
});

// ==========================================
// POST /api/adhd/plan-day - Morning Activation
// ==========================================
/**
 * Create daily plan based on goals and energy
 *
 * Request: {
 *   goals?: string[],          // Max 3 goals
 *   available_minutes?: number,// Default 480 (8 hours)
 *   energy_profile?: 'low' | 'medium' | 'high',
 *   must_do_task_ids?: number[]
 * }
 *
 * Response: {
 *   plan_id, plan_date, scheduled_blocks[],
 *   total_planned_minutes, buffer_minutes,
 *   warnings[], tips[]
 * }
 */
router.post('/plan-day', async (req, res) => {
    try {
        const { goals, available_minutes, energy_profile, must_do_task_ids } = req.body;

        // Validate goals
        if (goals && (!Array.isArray(goals) || goals.length > 3)) {
            return res.status(400).json({
                error: 'Goals must be an array with max 3 items'
            });
        }

        const plan = await adhdService.planDay({
            goals: goals || [],
            available_minutes,
            energy_profile: energy_profile || 'medium',
            must_do_task_ids: must_do_task_ids || []
        });

        res.json(plan);
    } catch (error) {
        console.error('[ADHD] Error creating plan:', error);
        res.status(500).json({
            error: 'Failed to create daily plan',
            message: error.message
        });
    }
});

// ==========================================
// POST /api/adhd/distraction - Log Distraction
// ==========================================
/**
 * Log distraction during focus time
 * Can optionally capture as parking lot task
 *
 * Request: {
 *   source: 'phone' | 'thought' | 'person' | 'environment' | 'internal' | 'other',
 *   description?: string,
 *   capture_as_task?: boolean,
 *   task_title?: string
 * }
 *
 * Response: {
 *   distraction_id, captured_task?, encouragement, focus_reminder
 * }
 */
router.post('/distraction', async (req, res) => {
    try {
        const { source, description, capture_as_task, task_title } = req.body;

        if (!source) {
            return res.status(400).json({
                error: 'Source is required',
                valid_sources: ['phone', 'thought', 'person', 'environment', 'internal', 'other']
            });
        }

        const result = await adhdService.logDistraction({
            source,
            description: description || '',
            capture_as_task: capture_as_task || false,
            task_title: task_title || ''
        });

        res.json(result);
    } catch (error) {
        console.error('[ADHD] Error logging distraction:', error);
        res.status(500).json({
            error: 'Failed to log distraction',
            message: error.message
        });
    }
});

// ==========================================
// GET /api/adhd/summary - Day/Week Summary
// ==========================================
/**
 * Get productivity summary with patterns and insights
 *
 * Query: ?period=today|yesterday|week|month
 *
 * Response: {
 *   period, productivity, patterns,
 *   estimation_accuracy, insights[], recommendations[]
 * }
 */
router.get('/summary', async (req, res) => {
    try {
        const period = req.query.period || 'today';
        const validPeriods = ['today', 'yesterday', 'week', 'month'];

        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                error: 'Invalid period',
                valid_periods: validPeriods
            });
        }

        const summary = await adhdService.summarize(period);
        res.json(summary);
    } catch (error) {
        console.error('[ADHD] Error getting summary:', error);
        res.status(500).json({
            error: 'Failed to get summary',
            message: error.message
        });
    }
});

// ==========================================
// GET /api/adhd/focus-recommendation - What To Do Next
// ==========================================
/**
 * Get AI recommendation for next action
 *
 * Query: ?energy=low|medium|high&available_minutes=45
 *
 * Response: {
 *   recommended_action: 'start_sprint' | 'take_break' | 'plan_day' | 'review_parking_lot',
 *   if_start_sprint?: { suggested_bucket, suggested_tasks[], estimated_total_minutes },
 *   reasoning, alternative_actions[]
 * }
 */
router.get('/focus-recommendation', async (req, res) => {
    try {
        const energy = req.query.energy;
        const available_minutes = req.query.available_minutes
            ? parseInt(req.query.available_minutes)
            : undefined;

        if (energy && !['low', 'medium', 'high'].includes(energy)) {
            return res.status(400).json({
                error: 'Invalid energy level',
                valid_levels: ['low', 'medium', 'high']
            });
        }

        const recommendation = await adhdService.getFocusRecommendation({
            energy,
            available_minutes
        });

        res.json(recommendation);
    } catch (error) {
        console.error('[ADHD] Error getting recommendation:', error);
        res.status(500).json({
            error: 'Failed to get focus recommendation',
            message: error.message
        });
    }
});

// ==========================================
// POST /api/adhd/sprint/start - Start Structured Sprint
// ==========================================
/**
 * Start a sprint with smart task selection
 *
 * Request: {
 *   bucket: 'urgent' | 'deadline' | 'admin' | 'creative',
 *   task_ids?: number[],      // Specific tasks (optional)
 *   target_minutes?: number,  // Default 45
 *   goal?: string             // Sprint goal
 * }
 *
 * Response: Sprint object with selected_tasks
 */
router.post('/sprint/start', async (req, res) => {
    try {
        const { bucket, task_ids, target_minutes, goal } = req.body;

        if (!bucket) {
            return res.status(400).json({
                error: 'Bucket is required',
                valid_buckets: ['urgent', 'deadline', 'admin', 'creative']
            });
        }

        const sprint = await adhdService.startStructuredSprint({
            bucket,
            task_ids: task_ids || [],
            target_minutes: target_minutes || 45,
            goal: goal || ''
        });

        res.json(sprint);
    } catch (error) {
        console.error('[ADHD] Error starting sprint:', error);
        res.status(500).json({
            error: 'Failed to start sprint',
            message: error.message
        });
    }
});

export default router;
