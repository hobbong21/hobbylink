-- Add typing status table
CREATE TABLE IF NOT EXISTS typing_status (
    id VARCHAR(100) PRIMARY KEY,
    meetup_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_typing BOOLEAN NOT NULL DEFAULT FALSE,
    last_typing_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for typing status
CREATE INDEX idx_typing_status_meetup_typing ON typing_status(meetup_id, is_typing);
CREATE INDEX idx_typing_status_last_typing ON typing_status(last_typing_at);

-- Add user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    meetup_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    connected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE CASCADE
);

-- Add indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_meetup_status ON user_sessions(meetup_id, status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_meetup ON user_sessions(user_id, meetup_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Add indexes to chat_messages for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_meetup_sent_at ON chat_messages(meetup_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_message_id ON chat_messages(client_message_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_meetup_status ON chat_messages(meetup_id, status);