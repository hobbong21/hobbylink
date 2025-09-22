-- Add new columns to chat_messages table (idempotent)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'SENDING';
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS client_message_id VARCHAR(100);
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index for client_message_id for duplicate prevention
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_id ON chat_messages(client_message_id);

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);

-- Create typing_status table
CREATE TABLE IF NOT EXISTS typing_status (
    id VARCHAR(100) PRIMARY KEY,
    meetup_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    last_typing_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for typing_status
CREATE INDEX IF NOT EXISTS idx_typing_status_meetup ON typing_status(meetup_id, is_typing);
CREATE INDEX IF NOT EXISTS idx_typing_status_last_typing ON typing_status(last_typing_at);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    meetup_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'ONLINE',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE CASCADE
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_meetup_status ON user_sessions(meetup_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_meetup ON user_sessions(user_id, meetup_id);