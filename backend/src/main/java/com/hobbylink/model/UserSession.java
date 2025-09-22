package com.hobbylink.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 사용자 세션을 나타내는 엔티티
 */
@Entity
@Table(name = "user_sessions")
public class UserSession {
    
    @Id
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "meetup_id", nullable = false)
    private Long meetupId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private UserStatus status = UserStatus.ONLINE;
    
    @Column(name = "last_activity")
    private LocalDateTime lastActivity;
    
    @Column(name = "connected_at")
    private LocalDateTime connectedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id", insertable = false, updatable = false)
    private Meetup meetup;
    
    // 기본 생성자
    public UserSession() {}
    
    // 생성자
    public UserSession(String sessionId, Long userId, Long meetupId) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.meetupId = meetupId;
        this.lastActivity = LocalDateTime.now();
        this.connectedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Long getMeetupId() {
        return meetupId;
    }
    
    public void setMeetupId(Long meetupId) {
        this.meetupId = meetupId;
    }
    
    public UserStatus getStatus() {
        return status;
    }
    
    public void setStatus(UserStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getLastActivity() {
        return lastActivity;
    }
    
    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }
    
    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }
    
    public void setConnectedAt(LocalDateTime connectedAt) {
        this.connectedAt = connectedAt;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Meetup getMeetup() {
        return meetup;
    }
    
    public void setMeetup(Meetup meetup) {
        this.meetup = meetup;
    }
    
    /**
     * 사용자 활동 시간 업데이트
     */
    public void updateActivity() {
        this.lastActivity = LocalDateTime.now();
    }
}