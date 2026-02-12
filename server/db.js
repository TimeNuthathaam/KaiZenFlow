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
                mood ENUM('flow', 'okay', 'drained') NOT NULL,
                notes TEXT,
                tasks_completed TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_mood (mood),
                INDEX idx_created (created_at)
            )
        `);

        // Verify tables
        const [tables] = await pool.query(`SHOW TABLES LIKE 'kaizen%'`);
        logStep(4, 'TABLES_INIT', 'ok', `${tables.length} tables ready (kaizen_tasks, kaizen_sprints, kaizen_logs)`);
        return true;

    } catch (error) {
        logStep(4, 'TABLES_INIT', 'fail', `Table creation failed: ${error.message}`);
        return false;
    }
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
