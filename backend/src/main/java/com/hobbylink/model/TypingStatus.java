package com.hobbylink.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 타이핑 상태를 나타내는 엔티티
 */
@Entity
@Table(name = "typing_status")
public class TypingStatus {
    
    @Id
    private String id; // meetupId + "_" + userId
    
    @Column(name = "meetup_id", nullable = false)
    private Long meetupId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "is_typing", nullable = false)
    private boolean isTyping = false;
    
    @Column(name = "last_typing_at")
    private LocalDateTime lastTypingAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id", insertable = false, updatable = false)
    private Meetup meetup;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    // 기본 생성자
    public TypingStatus() {}
    
    // 생성자
    public TypingStatus(Long meetupId, Long userId) {
        this.id = meetupId + "_" + userId;
        this.meetupId = meetupId;
        this.userId = userId;
        this.lastTypingAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public Long getMeetupId() {
        return meetupId;
    }
    
    public void setMeetupId(Long meetupId) {
        this.meetupId = meetupId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public boolean isTyping() {
        return isTyping;
    }
    
    public void setTyping(boolean typing) {
        isTyping = typing;
    }
    
    public LocalDateTime getLastTypingAt() {
        return lastTypingAt;
    }
    
    public void setLastTypingAt(LocalDateTime lastTypingAt) {
        this.lastTypingAt = lastTypingAt;
    }
    
    public Meetup getMeetup() {
        return meetup;
    }
    
    public void setMeetup(Meetup meetup) {
        this.meetup = meetup;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
}