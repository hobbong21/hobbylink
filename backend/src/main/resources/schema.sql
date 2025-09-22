-- HobbyLink Database Schema
-- 첨부된 DB 스키마 기반으로 수정

-- 카테고리 테이블
CREATE TABLE IF NOT EXISTS category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    profile_image_url VARCHAR(500),
    email VARCHAR(255),
    title VARCHAR(100),
    join_date DATE DEFAULT CURRENT_DATE,
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT
);

-- 취미 모임 테이블
CREATE TABLE IF NOT EXISTS hobby_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description CLOB,
    location_lng NUMBER,
    location_lat NUMBER,
    reg_date DATE DEFAULT CURRENT_DATE,
    creator_id BIGINT NOT NULL,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);

-- 취미 모임 멤버 테이블
CREATE TABLE IF NOT EXISTS hobby_group_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    joined_date DATE DEFAULT CURRENT_DATE,
    user_id BIGINT NOT NULL,
    hobby_group_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hobby_group_id) REFERENCES hobby_group(id),
    UNIQUE(user_id, hobby_group_id)
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS board_post (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content CLOB,
    hobby_group_id BIGINT,
    reg_date DATE DEFAULT CURRENT_DATE,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hobby_group_id) REFERENCES hobby_group(id)
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content CLOB NOT NULL,
    reg_date DATE DEFAULT CURRENT_DATE,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (post_id) REFERENCES board_post(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_room (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    size_limit INTEGER,
    hobby_group_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (hobby_group_id) REFERENCES hobby_group(id)
);

-- 채팅방 멤버 테이블
CREATE TABLE IF NOT EXISTS chat_room_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    join_date DATE DEFAULT CURRENT_DATE,
    user_id BIGINT NOT NULL,
    chat_room_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (chat_room_id) REFERENCES chat_room(id),
    UNIQUE(user_id, chat_room_id)
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(1000) NOT NULL,
    sender_id BIGINT NOT NULL,
    chat_room_id BIGINT NOT NULL,
    send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (chat_room_id) REFERENCES chat_room(id)
);

-- 미팅 테이블 (기존 hobby_group을 확장)
CREATE TABLE IF NOT EXISTS meetups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meetup_date_time TIMESTAMP NOT NULL,
    location VARCHAR(500),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    type VARCHAR(50) DEFAULT 'PLANNED',
    category VARCHAR(100),
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 미팅 참가자 테이블
CREATE TABLE IF NOT EXISTS meetup_participations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    meetup_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'JOINED',
    FOREIGN KEY (meetup_id) REFERENCES meetups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(meetup_id, user_id)
);

-- 개선된 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'TEXT',
    status VARCHAR(20) DEFAULT 'SENDING',
    media_url VARCHAR(500),
    client_message_id VARCHAR(100),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    meetup_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 타이핑 상태 테이블
CREATE TABLE IF NOT EXISTS typing_status (
    id VARCHAR(100) PRIMARY KEY,
    meetup_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    last_typing_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meetup_id) REFERENCES meetups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    meetup_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'ONLINE',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (meetup_id) REFERENCES meetups(id)
);

-- 스튜디오 테이블
CREATE TABLE IF NOT EXISTS studios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cover_image VARCHAR(500),
    category VARCHAR(100),
    location VARCHAR(500),
    tags TEXT,
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    project_url VARCHAR(500),
    tags TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    user_id BIGINT NOT NULL,
    studio_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (studio_id) REFERENCES studios(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hobby_group_creator ON hobby_group(creator_id);
CREATE INDEX IF NOT EXISTS idx_hobby_group_category ON hobby_group(category_id);
CREATE INDEX IF NOT EXISTS idx_hobby_group_member_user ON hobby_group_member(user_id);
CREATE INDEX IF NOT EXISTS idx_hobby_group_member_group ON hobby_group_member(hobby_group_id);
CREATE INDEX IF NOT EXISTS idx_board_post_user ON board_post(user_id);
CREATE INDEX IF NOT EXISTS idx_board_post_group ON board_post(hobby_group_id);
CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_user ON comment(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_group ON chat_room(hobby_group_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_member_user ON chat_room_member(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_member_room ON chat_room_member(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_sender ON chat_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_room ON chat_message(chat_room_id);

-- 새로운 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_meetups_creator ON meetups(creator_id);
CREATE INDEX IF NOT EXISTS idx_meetups_date ON meetups(meetup_date_time);
CREATE INDEX IF NOT EXISTS idx_meetup_participations_meetup ON meetup_participations(meetup_id);
CREATE INDEX IF NOT EXISTS idx_meetup_participations_user ON meetup_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_meetup_sent ON chat_messages(meetup_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_client_id ON chat_messages(client_message_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_meetup ON typing_status(meetup_id, is_typing);
CREATE INDEX IF NOT EXISTS idx_user_sessions_meetup_online ON user_sessions(meetup_id, status);
CREATE INDEX IF NOT EXISTS idx_studios_creator ON studios(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_studio ON projects(studio_id);