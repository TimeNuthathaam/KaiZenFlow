import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, isDatabaseReady, getDiagnosticSteps } from './db.js';
import { apiKeyAuth } from './middleware/auth.js';
import { sseHandler } from './services/sse.js';
import tasksRouter from './routes/tasks.js';
import sprintsRouter from './routes/sprints.js';
import kaizenLogsRouter from './routes/kaizenLogs.js';
import mcpRouter from './routes/mcp.js';

dotenv.config({ override: false });

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

// ==========================================
// Health check — shows DB diagnostic steps (no auth required)
// ==========================================
app.get('/api/health', async (req, res) => {
    const steps = getDiagnosticSteps();
    const dbConnected = isDatabaseReady();

    // Quick live DB check
    let liveDbCheck = false;
    try {
        const pool = (await import('./db.js')).default;
        const conn = await pool.getConnection();
        conn.release();
        liveDbCheck = true;
    } catch (e) {
        liveDbCheck = false;
    }

    const status = dbConnected && liveDbCheck ? 'ok' : 'degraded';

    res.json({
        status,
        timestamp: new Date().toISOString(),
        database: {
            connected: liveDbCheck,
            tables_ready: dbConnected,
            host: `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`,
            database: process.env.DB_NAME || 'unknown',
        },
        startup_diagnostics: steps.map(s => ({
            step: s.step,
            name: s.name,
            status: s.emoji,
            detail: s.detail,
        })),
    });
});

// ==========================================
// SSE Real-time Events (no auth — frontend uses this)
// ==========================================
app.get('/api/events', sseHandler);

// ==========================================
// API Key Auth — applied to all /api routes below
// ==========================================
app.use('/api', apiKeyAuth);

// ==========================================
// MCP Streamable HTTP endpoint
// ==========================================
app.use('/mcp', mcpRouter);

// Routes
app.use('/api/tasks', tasksRouter);
app.use('/api/sprints', sprintsRouter);
app.use('/api/kaizen-logs', kaizenLogsRouter);

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

// ==========================================
// Startup: Initialize DB then listen
// ==========================================
async function startServer() {
    console.log(`
╔══════════════════════════════════════════╗
║        🧘 Kaizen Flow API Server         ║
╚══════════════════════════════════════════╝`);

    // Initialize database (retry + auto-create tables)
    const dbOk = await initializeDatabase();

    if (!dbOk) {
        console.log('⚠️  Server starting in DEGRADED mode (DB not available)');
        console.log('   Visit /api/health to see diagnostic details\n');
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health`);
        console.log(`   SSE Events:   http://localhost:${PORT}/api/events`);
        console.log(`   API Key:      ${process.env.API_KEY ? 'ENABLED ✅' : 'DISABLED ⚠️'}`);
        console.log(`   Press Ctrl+C to stop\n`);
    });
}

startServer();
