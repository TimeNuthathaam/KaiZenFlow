import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tasksRouter from './routes/tasks.js';
import sprintsRouter from './routes/sprints.js';
import kaizenLogsRouter from './routes/kaizenLogs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/sprints', sprintsRouter);
app.use('/api/kaizen-logs', kaizenLogsRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║        🧘 Kaizen Flow API Server         ║
║──────────────────────────────────────────║
║  Running on: http://localhost:${PORT}       ║
║  Press Ctrl+C to stop                    ║
╚══════════════════════════════════════════╝
  `);
});
