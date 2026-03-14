-- Milo Radio Database Schema (MySQL/MariaDB)

CREATE TABLE IF NOT EXISTS stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_name VARCHAR(255) NOT NULL,
    sender_url TEXT NOT NULL,
    genre VARCHAR(100),
    sender_logo TEXT,
    now_playing_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listen_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    station_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Beispiel-Daten (Optional)
INSERT INTO stations (sender_name, sender_url, genre, sender_logo) VALUES 
('Milo-Radio Love', 'https://stream.milo-radio.de/live', 'Love', './images/cholo_love.png'),
('Milo-Radio Party', 'https://stream.milo-radio.de/party', 'Party', './images/cholo_love.png');
