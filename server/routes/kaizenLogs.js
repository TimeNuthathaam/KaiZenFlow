import express from 'express';
import pool from '../db.js';
import { broadcast } from '../services/sse.js';

const router = express.Router();

// GET all kaizen logs
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const [rows] = await pool.query(`
      SELECT kl.*, s.bucket as sprint_bucket, s.started_at as sprint_started
      FROM kaizen_logs kl
      LEFT JOIN kaizen_sprints s ON kl.sprint_id = s.id
      ORDER BY kl.created_at DESC
      LIMIT ?
    `, [limit]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching kaizen logs:', error);
        res.status(500).json({ error: 'Failed to fetch kaizen logs' });
    }
});

// GET kaizen log stats
router.get('/stats', async (req, res) => {
    try {
        // Mood distribution
        const [moodStats] = await pool.query(`
      SELECT mood, COUNT(*) as count, SUM(duration_seconds) as total_seconds
      FROM kaizen_logs
      GROUP BY mood
    `);

        // Bucket performance
        const [bucketStats] = await pool.query(`
      SELECT bucket, 
             COUNT(*) as sessions,
             AVG(duration_seconds) as avg_duration,
             SUM(CASE WHEN mood = 'flow' THEN 1 ELSE 0 END) as flow_count,
             SUM(CASE WHEN mood = 'okay' THEN 1 ELSE 0 END) as okay_count,
             SUM(CASE WHEN mood = 'drained' THEN 1 ELSE 0 END) as drained_count
      FROM kaizen_logs
      GROUP BY bucket
    `);

        // Recent trend (last 7 days)
        const [recentTrend] = await pool.query(`
      SELECT DATE(created_at) as date,
             COUNT(*) as sessions,
             SUM(duration_seconds) as total_seconds,
             AVG(CASE 
               WHEN mood = 'flow' THEN 3
               WHEN mood = 'okay' THEN 2
               WHEN mood = 'drained' THEN 1
             END) as avg_mood_score
      FROM kaizen_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

        res.json({
            moodStats,
            bucketStats,
            recentTrend
        });
    } catch (error) {
        console.error('Error fetching kaizen stats:', error);
        res.status(500).json({ error: 'Failed to fetch kaizen stats' });
    }
});

// POST create kaizen log
router.post('/', async (req, res) => {
    try {
        const { sprint_id, bucket, duration_seconds, mood, notes, tasks_completed } = req.body;

        if (!bucket || !mood) {
            return res.status(400).json({ error: 'Bucket and mood are required' });
        }

        if (!['flow', 'okay', 'drained'].includes(mood)) {
            return res.status(400).json({ error: 'Invalid mood value' });
        }

        const [result] = await pool.query(`
      INSERT INTO kaizen_logs (sprint_id, bucket, duration_seconds, mood, notes, tasks_completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
            sprint_id || null,
            bucket,
            duration_seconds || 0,
            mood,
            notes || null,
            tasks_completed ? JSON.stringify(tasks_completed) : null
        ]);

        const [newLog] = await pool.query('SELECT * FROM kaizen_logs WHERE id = ?', [result.insertId]);
        broadcast('kaizen_log_created', newLog[0]);
        res.status(201).json(newLog[0]);
    } catch (error) {
        console.error('Error creating kaizen log:', error);
        res.status(500).json({ error: 'Failed to create kaizen log' });
    }
});

// DELETE kaizen log
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM kaizen_logs WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Kaizen log not found' });
        }
        broadcast('kaizen_log_deleted', { id: parseInt(req.params.id) });
        res.json({ success: true, message: 'Kaizen log deleted' });
    } catch (error) {
        console.error('Error deleting kaizen log:', error);
        res.status(500).json({ error: 'Failed to delete kaizen log' });
    }
});

export default router;
