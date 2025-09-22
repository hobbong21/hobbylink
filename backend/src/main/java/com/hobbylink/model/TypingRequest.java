package com.hobbylink.model;

/**
 * 타이핑 요청을 나타내는 DTO
 */
public class TypingRequest {
    
    private Long userId;
    private Long meetupId;
    private boolean isTyping;
    
    // 기본 생성자
    public TypingRequest() {}
    
    // 생성자
    public TypingRequest(Long userId, Long meetupId, boolean isTyping) {
        this.userId = userId;
        this.meetupId = meetupId;
        this.isTyping = isTyping;
    }
    
    // Getters and Setters
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
    
    public boolean isTyping() {
        return isTyping;
    }
    
    public void setTyping(boolean typing) {
        isTyping = typing;
    }
}