import express from 'express';
import pool from '../db.js';
import { broadcast } from '../services/sse.js';

const router = express.Router();

// GET all kaizen_tasks
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT * FROM kaizen_tasks 
      ORDER BY 
        CASE bucket 
          WHEN 'unsorted' THEN 1 
          WHEN 'urgent' THEN 2 
          WHEN 'deadline' THEN 3 
          WHEN 'admin' THEN 4 
          WHEN 'creative' THEN 5 
        END,
        sort_order ASC,
        created_at DESC
    `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching kaizen_tasks:', error);
        res.status(500).json({ error: 'Failed to fetch kaizen_tasks' });
    }
});

// GET single task
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// POST create task
router.post('/', async (req, res) => {
    try {
        const { title, bucket = 'unsorted' } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Title is required' });
        }

        const [result] = await pool.query(
            'INSERT INTO kaizen_tasks (title, bucket) VALUES (?, ?)',
            [title.trim(), bucket]
        );

        const [newTask] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [result.insertId]);
        broadcast('task_created', newTask[0]);
        res.status(201).json(newTask[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT update task
router.put('/:id', async (req, res) => {
    try {
        const { title, bucket, is_daily_highlight, is_completed, sort_order } = req.body;
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title.trim());
        }
        if (bucket !== undefined) {
            updates.push('bucket = ?');
            values.push(bucket);
        }
        if (is_daily_highlight !== undefined) {
            // If setting as daily highlight, unset all others first
            if (is_daily_highlight === true) {
                await pool.query('UPDATE kaizen_tasks SET is_daily_highlight = FALSE WHERE is_daily_highlight = TRUE');
            }
            updates.push('is_daily_highlight = ?');
            values.push(is_daily_highlight);
        }
        if (is_completed !== undefined) {
            updates.push('is_completed = ?');
            values.push(is_completed);
        }
        if (sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(sort_order);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id);
        await pool.query(`UPDATE kaizen_tasks SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updatedTask] = await pool.query('SELECT * FROM kaizen_tasks WHERE id = ?', [req.params.id]);
        if (updatedTask.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        broadcast('task_updated', updatedTask[0]);
        res.json(updatedTask[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE task
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM kaizen_tasks WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        broadcast('task_deleted', { id: parseInt(req.params.id) });
        res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Bulk update sort order
router.post('/reorder', async (req, res) => {
    try {
        const { tasks } = req.body; // Array of { id, sort_order, bucket }

        for (const task of tasks) {
            await pool.query(
                'UPDATE kaizen_tasks SET sort_order = ?, bucket = ? WHERE id = ?',
                [task.sort_order, task.bucket, task.id]
            );
        }

        broadcast('tasks_reordered', { count: tasks.length });
        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering tasks:', error);
        res.status(500).json({ error: 'Failed to reorder tasks' });
    }
});

export default router;
