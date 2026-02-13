import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load .env only if env vars not already set (Docker injects env vars directly)
dotenv.config({ override: false });

// ==========================================
// Diagnostic Steps Tracker
// ==========================================
const diagnosticSteps = [];

function logStep(step, name, status, detail) {
    const emoji = status === 'ok' ? '✅' : '❌';
    const entry = { step, name, status, emoji, detail, timestamp: new Date().toISOString() };
    diagnosticSteps.push(entry);
    console.log(`  ${emoji} Step ${step}: [${name}] ${detail}`);
    return entry;
}

export function getDiagnosticSteps() {
    return [...diagnosticSteps];
}

// ==========================================
// Step 1: Check Environment Variables
// ==========================================
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'kaizen_flow';

const requiredVars = ['DB_HOST', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    logStep(1, 'ENV_VARS', 'fail', `Missing: ${missingVars.join(', ')}`);
} else {
    logStep(1, 'ENV_VARS', 'ok', `Host=${DB_HOST}:${DB_PORT} User=${DB_USER} DB=${DB_NAME}`);
}

// ==========================================
// Step 2: Create Connection Pool
// ==========================================
let pool;
try {
    pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 10000,
    });
    logStep(2, 'POOL_CREATED', 'ok', 'Connection pool created');
} catch (error) {
    logStep(2, 'POOL_CREATED', 'fail', `Pool creation failed: ${error.message}`);
}

// ==========================================
// Step 3: Test Connection with Retry
// ==========================================
const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 2000;

async function testConnectionWithRetry() {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const connection = await pool.getConnection();
            connection.release();
            logStep(3, 'DB_CONNECTION', 'ok', `Connected to MariaDB (attempt ${attempt}/${MAX_RETRIES})`);
            return true;
        } catch (error) {
            const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
            const msg = `Attempt ${attempt}/${MAX_RETRIES} failed: ${error.code || error.message}`;

            if (attempt < MAX_RETRIES) {
                console.log(`  ⏳ ${msg} — retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                logStep(3, 'DB_CONNECTION', 'fail', `All ${MAX_RETRIES} attempts failed: ${error.code || error.message}`);
                return false;
            }
        }
    }
    return false;
}

// ==========================================
// Step 4: Auto-Initialize Tables
// ==========================================
async function initializeTables() {
    try {
        // Create kaizen_tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kaizen_tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                bucket ENUM('unsorted', 'urgent', 'deadline', 'admin', 'creative') DEFAULT 'unsorted',
                is_daily_highlight BOOLEAN DEFAULT FALSE,
                is_completed BOOLEAN DEFAULT FALSE,
                sort_order INT DEFAULT 0,
                estimated_duration INT DEFAULT NULL COMMENT 'Estimated minutes',
                energy_level ENUM('low', 'medium', 'high') DEFAULT NULL,
                priority_type ENUM('fire', 'bolt', 'turtle') DEFAULT NULL COMMENT '🔥⚡🐢',
                source ENUM('manual', 'parking_lot', 'voice', 'mcp') DEFAULT 'manual',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_bucket (bucket),
                INDEX idx_highlight (is_daily_highlight),
                INDEX idx_completed (is_completed)
            )
        `);

        // Create kaizen_sprints table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kaizen_sprints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bucket VARCHAR(50) NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP NULL,
                duration_seconds INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                estimated_total_minutes INT DEFAULT NULL COMMENT 'Sum of task estimates in this sprint',
                INDEX idx_active (is_active),
                INDEX idx_started (started_at)
            )
        `);

        // Create kaizen_logs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kaizen_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sprint_id INT,
                bucket VARCHAR(50) NOT NULL,
                duration_seconds INT NOT NULL DEFAULT 0,
                estimated_seconds INT DEFAULT NULL COMMENT 'Sum of estimated durations for comparison',
                mood ENUM('flow', 'okay', 'drained') NOT NULL,
                notes TEXT,
                tasks_completed TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_mood (mood),
                INDEX idx_created (created_at)
            )
        `);

        // Create adhd_distractions table (OpenClaw integration)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS adhd_distractions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                source ENUM('phone', 'thought', 'person', 'environment', 'internal', 'other') DEFAULT 'other',
                description TEXT,
                captured_task_id INT DEFAULT NULL COMMENT 'If converted to task, link here',
                sprint_id INT DEFAULT NULL COMMENT 'Sprint when distraction occurred',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_source (source),
                INDEX idx_created (created_at),
                INDEX idx_sprint (sprint_id)
            )
        `);

        // Create adhd_daily_plans table (Morning Activation)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS adhd_daily_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plan_date DATE NOT NULL,
                morning_energy ENUM('low', 'medium', 'high') DEFAULT 'medium',
                total_available_minutes INT DEFAULT 480 COMMENT '8 hours default',
                planned_tasks JSON COMMENT 'Array of task IDs with order',
                goals JSON COMMENT 'Array of goal strings',
                notes TEXT,
                is_executed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_plan_date (plan_date),
                INDEX idx_plan_date (plan_date)
            )
        `);

        // Create adhd_streaks table (Gamification)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS adhd_streaks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                streak_type ENUM('daily_plan', 'morning_activation', 'sprint_complete', 'focus_session') NOT NULL,
                current_count INT DEFAULT 0,
                longest_count INT DEFAULT 0,
                last_activity_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_streak_type (streak_type)
            )
        `);

        // Initialize default streaks
        await pool.query(`
            INSERT IGNORE INTO adhd_streaks (streak_type, current_count, longest_count)
            VALUES
                ('daily_plan', 0, 0),
                ('morning_activation', 0, 0),
                ('sprint_complete', 0, 0),
                ('focus_session', 0, 0)
        `);

        // Verify tables
        const [kaizenTables] = await pool.query(`SHOW TABLES LIKE 'kaizen%'`);
        const [adhdTables] = await pool.query(`SHOW TABLES LIKE 'adhd%'`);
        logStep(4, 'TABLES_INIT', 'ok', `${kaizenTables.length + adhdTables.length} tables ready (kaizen: ${kaizenTables.length}, adhd: ${adhdTables.length})`);

        // Step 5: Migrate existing tables (add new columns safely)
        await migrateColumns();

        return true;

    } catch (error) {
        logStep(4, 'TABLES_INIT', 'fail', `Table creation failed: ${error.message}`);
        return false;
    }
}

// ==========================================
// Step 5: Migrate columns for existing tables
// ==========================================
async function migrateColumns() {
    const migrations = [
        // Existing ADHD v2 columns
        { table: 'kaizen_tasks', column: 'estimated_duration', sql: 'ALTER TABLE kaizen_tasks ADD COLUMN estimated_duration INT DEFAULT NULL' },
        { table: 'kaizen_tasks', column: 'energy_level', sql: "ALTER TABLE kaizen_tasks ADD COLUMN energy_level ENUM('low','medium','high') DEFAULT NULL" },
        { table: 'kaizen_tasks', column: 'priority_type', sql: "ALTER TABLE kaizen_tasks ADD COLUMN priority_type ENUM('fire','bolt','turtle') DEFAULT NULL" },
        { table: 'kaizen_tasks', column: 'source', sql: "ALTER TABLE kaizen_tasks ADD COLUMN source ENUM('manual','parking_lot','voice','mcp') DEFAULT 'manual'" },
        { table: 'kaizen_sprints', column: 'estimated_total_minutes', sql: 'ALTER TABLE kaizen_sprints ADD COLUMN estimated_total_minutes INT DEFAULT NULL' },
        { table: 'kaizen_logs', column: 'estimated_seconds', sql: 'ALTER TABLE kaizen_logs ADD COLUMN estimated_seconds INT DEFAULT NULL' },

        // OpenClaw Integration columns (ADHD Executive Function Engine)
        { table: 'kaizen_tasks', column: 'dopamine_score', sql: 'ALTER TABLE kaizen_tasks ADD COLUMN dopamine_score TINYINT DEFAULT NULL COMMENT "0=Boring 1=Meh 2=Interesting 3=Exciting"' },
        { table: 'kaizen_tasks', column: 'friction_level', sql: "ALTER TABLE kaizen_tasks ADD COLUMN friction_level ENUM('low','medium','high') DEFAULT NULL COMMENT 'Difficulty to start'" },
        { table: 'kaizen_tasks', column: 'environment', sql: "ALTER TABLE kaizen_tasks ADD COLUMN environment ENUM('home','clinic','cafe','anywhere') DEFAULT 'anywhere' COMMENT 'Best location for task'" },
        { table: 'kaizen_tasks', column: 'deadline_at', sql: 'ALTER TABLE kaizen_tasks ADD COLUMN deadline_at DATETIME DEFAULT NULL COMMENT "Hard deadline"' },
        { table: 'kaizen_tasks', column: 'tags', sql: 'ALTER TABLE kaizen_tasks ADD COLUMN tags JSON DEFAULT NULL COMMENT "Array of tag strings"' },

        // Sprint enhancements for OpenClaw
        { table: 'kaizen_sprints', column: 'goal', sql: 'ALTER TABLE kaizen_sprints ADD COLUMN goal VARCHAR(255) DEFAULT NULL COMMENT "Sprint goal from OpenClaw"' },
        { table: 'kaizen_sprints', column: 'planned_task_ids', sql: 'ALTER TABLE kaizen_sprints ADD COLUMN planned_task_ids JSON DEFAULT NULL COMMENT "Tasks planned for this sprint"' },

        // Kaizen logs enhancements
        { table: 'kaizen_logs', column: 'distraction_count', sql: 'ALTER TABLE kaizen_logs ADD COLUMN distraction_count INT DEFAULT 0 COMMENT "Number of distractions during sprint"' },
    ];

    let added = 0;
    for (const m of migrations) {
        try {
            const [cols] = await pool.query(`SHOW COLUMNS FROM ${m.table} LIKE '${m.column}'`);
            if (cols.length === 0) {
                await pool.query(m.sql);
                added++;
            }
        } catch (e) {
            console.log(`  ⚠️ Migration skip: ${m.table}.${m.column} — ${e.message}`);
        }
    }
    logStep(5, 'MIGRATION', 'ok', `${added} new columns added (${migrations.length} checked)`);
}

// ==========================================
// Main initialization function
// ==========================================
let dbReady = false;

export async function initializeDatabase() {
    console.log('\n🔗 Initializing database...');
    console.log(`   Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}\n`);

    const connected = await testConnectionWithRetry();
    if (!connected) {
        console.log('\n❌ Database initialization FAILED — server will start but DB operations will fail.');
        console.log('   Check /api/health for diagnostic details.\n');
        return false;
    }

    const tablesOk = await initializeTables();
    if (!tablesOk) {
        console.log('\n⚠️ Tables initialization failed — some features may not work.\n');
        return false;
    }

    dbReady = true;
    console.log('\n🎉 Database ready!\n');
    return true;
}

export function isDatabaseReady() {
    return dbReady;
}

export default pool;
