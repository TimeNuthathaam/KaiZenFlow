import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'myapp';

async function setup() {
    console.log('🔗 Connecting to MariaDB...');
    console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
    console.log(`   User: ${DB_USER}`);
    console.log(`   Database: ${DB_NAME}`);

    let connection;

    try {
        // Connect directly to the database
        connection = await mysql.createConnection({
            host: DB_HOST,
            port: DB_PORT,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        console.log('✅ Connected to MariaDB');

        // Create tables
        console.log('\n📋 Creating tables for Kaizen Flow...');

        // Tasks table
        await connection.query(`
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
        console.log('   ✅ kaizen_tasks table');

        // Sprints table
        await connection.query(`
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
        console.log('   ✅ kaizen_sprints table');

        // Kaizen logs table
        await connection.query(`
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
        console.log('   ✅ kaizen_logs table');

        // Verify tables exist
        const [tables] = await connection.query(`SHOW TABLES LIKE 'kaizen%'`);
        console.log(`\n📊 Tables created: ${tables.length}`);
        tables.forEach(t => console.log(`   - ${Object.values(t)[0]}`));

        console.log('\n🎉 Database setup complete!');
        console.log('   You can now start the server with: npm run dev');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Could not connect to MariaDB server.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Access denied. Check username and password.');
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setup();
