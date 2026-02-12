import express from 'express';
import pool from '../db.js';
import { broadcast } from '../services/sse.js';

const router = express.Router();

// GET active sprint
router.get('/active', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT * FROM kaizen_sprints 
      WHERE is_active = TRUE 
      ORDER BY started_at DESC 
      LIMIT 1
    `);

        if (rows.length === 0) {
            return res.json(null);
        }

        // Calculate elapsed time
        const sprint = rows[0];
        const elapsed = Math.floor((Date.now() - new Date(sprint.started_at).getTime()) / 1000);

        res.json({
            ...sprint,
            elapsed_seconds: elapsed
        });
    } catch (error) {
        console.error('Error fetching active sprint:', error);
        res.status(500).json({ error: 'Failed to fetch active sprint' });
    }
});

// GET sprint history
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const [rows] = await pool.query(`
      SELECT * FROM kaizen_sprints 
      WHERE is_active = FALSE 
      ORDER BY started_at DESC 
      LIMIT ?
    `, [limit]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching sprint history:', error);
        res.status(500).json({ error: 'Failed to fetch sprint history' });
    }
});

// POST start sprint
router.post('/start', async (req, res) => {
    try {
        const { bucket } = req.body;

        if (!bucket) {
            return res.status(400).json({ error: 'Bucket is required' });
        }

        // End any active kaizen_sprints first
        await pool.query(`
      UPDATE kaizen_sprints 
      SET is_active = FALSE, 
          ended_at = CURRENT_TIMESTAMP,
          duration_seconds = TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP)
      WHERE is_active = TRUE
    `);

        // Create new sprint
        const [result] = await pool.query(
            'INSERT INTO kaizen_sprints (bucket, is_active) VALUES (?, TRUE)',
            [bucket]
        );

        const [newSprint] = await pool.query('SELECT * FROM kaizen_sprints WHERE id = ?', [result.insertId]);
        broadcast('sprint_started', newSprint[0]);
        res.status(201).json(newSprint[0]);
    } catch (error) {
        console.error('Error starting sprint:', error);
        res.status(500).json({ error: 'Failed to start sprint' });
    }
});

// POST stop sprint
router.post('/stop', async (req, res) => {
    try {
        const [activeSprintRows] = await pool.query(`
      SELECT * FROM kaizen_sprints WHERE is_active = TRUE LIMIT 1
    `);

        if (activeSprintRows.length === 0) {
            return res.status(404).json({ error: 'No active sprint found' });
        }

        const sprintId = activeSprintRows[0].id;

        await pool.query(`
      UPDATE kaizen_sprints 
      SET is_active = FALSE, 
          ended_at = CURRENT_TIMESTAMP,
          duration_seconds = TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP)
      WHERE id = ?
    `, [sprintId]);

        const [stoppedSprint] = await pool.query('SELECT * FROM kaizen_sprints WHERE id = ?', [sprintId]);
        broadcast('sprint_stopped', stoppedSprint[0]);
        res.json(stoppedSprint[0]);
    } catch (error) {
        console.error('Error stopping sprint:', error);
        res.status(500).json({ error: 'Failed to stop sprint' });
    }
});

export default router;
