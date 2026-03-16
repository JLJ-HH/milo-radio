milo_radio-- Milo Radio Local Database Initialization Script
-- For use with HeidiSQL or phpMyAdmin (XAMPP MariaDB)

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS milo_radio;
USE milo_radio;

-- 2. Create Stations Table
CREATE TABLE IF NOT EXISTS stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_name VARCHAR(255) NOT NULL,
    sender_url TEXT NOT NULL,
    genre VARCHAR(100),
    sender_logo TEXT,
    now_playing_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create Listen Events Table
CREATE TABLE IF NOT EXISTS listen_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    station_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Insert Sample Data
-- Add some stations
INSERT INTO stations (id, sender_name, sender_url, genre, sender_logo) VALUES 
(1, 'Milo-Radio Love', 'https://stream.milo-radio.de/live', 'Love', './images/cholo_love.png'),
(2, 'Milo-Radio Party', 'https://stream.milo-radio.de/party', 'Party', './images/cholo_love.png'),
(3, 'Rock Antenne', 'https://stream.rockantenne.de/rockantenne/stream/mp3', 'Rock', 'https://www.rockantenne.de/favicon.ico'),
(4, 'Sunshine Live', 'https://sunshinelive.hoerradar.de/sunshinelive-live-mp3-hq', 'Techno', 'https://www.sunshine-live.de/favicon.ico'),
(5, 'Antenne Bayern', 'https://stream.antenne.de/antenne-bayern/stream/mp3', 'Pop', 'https://www.antenne.de/favicon.ico')
ON DUPLICATE KEY UPDATE sender_name=VALUES(sender_name);

-- Add a test user (if needed)
-- INSERT INTO users (session_token) VALUES ('test_local_session');

-- Notification
SELECT 'Database milo_radio initialized successfully' AS message;
