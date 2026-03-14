-- PostgreSQL Datenbank Schema für milo-radio
-- Tabellen: users, stations, listen_events

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY,
    sender_name VARCHAR(255) NOT NULL,
    sender_url TEXT NOT NULL,
    sender_logo TEXT,
    genre VARCHAR(100),
    now_playing_url TEXT
);

CREATE TABLE IF NOT EXISTS listen_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    station_id INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance bei Aggregationen
CREATE INDEX IF NOT EXISTS idx_listen_events_station_id ON listen_events(station_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_user_id ON listen_events(user_id);
CREATE INDEX IF NOT EXISTS idx_listen_events_created_at ON listen_events(created_at);
