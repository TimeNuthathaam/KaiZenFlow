-- Kaizen Flow Database Schema
-- Run this script to create the required tables

CREATE DATABASE IF NOT EXISTS kaizen_flow;
USE kaizen_flow;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
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
);

-- Sprints table
CREATE TABLE IF NOT EXISTS sprints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bucket VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_active (is_active),
    INDEX idx_started (started_at)
);

-- Kaizen Logs table
CREATE TABLE IF NOT EXISTS kaizen_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sprint_id INT,
    bucket VARCHAR(50) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    mood ENUM('flow', 'okay', 'drained') NOT NULL,
    notes TEXT,
    tasks_completed TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL,
    INDEX idx_mood (mood),
    INDEX idx_created (created_at)
);

-- Insert sample tasks for testing (optional)
-- INSERT INTO tasks (title, bucket) VALUES 
--     ('จ่ายบิลค่าไฟ', 'urgent'),
--     ('ตอบอีเมลลูกค้า', 'deadline'),
--     ('จัดเอกสารภาษี', 'admin'),
--     ('ออกแบบ Logo ใหม่', 'creative');
