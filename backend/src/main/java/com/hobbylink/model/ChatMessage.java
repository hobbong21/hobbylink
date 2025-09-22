package com.hobbylink.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 채팅 메시지를 나타내는 엔티티
 */
@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "formatted_content", columnDefinition = "TEXT")
    private String formattedContent;
    
    @Column(name = "type")
    private String type = "TEXT";
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private MessageStatus status = MessageStatus.SENDING;
    
    @Column(name = "media_url")
    private String mediaUrl;
    
    @Column(name = "client_message_id")
    private String clientMessageId;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "meetup_id", nullable = false)
    private Long meetupId;
    
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id", insertable = false, updatable = false)
    private Meetup meetup;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", insertable = false, updatable = false)
    private User sender;
    
    // 기본 생성자
    public ChatMessage() {
        this.sentAt = LocalDateTime.now();
    }
    
    // 생성자
    public ChatMessage(String content, Meetup meetup, User sender) {
        this.content = content;
        this.meetup = meetup;
        this.meetupId = meetup.getId();
        this.sender = sender;
        this.senderId = sender.getId();
        this.sentAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getFormattedContent() {
        return formattedContent;
    }
    
    public void setFormattedContent(String formattedContent) {
        this.formattedContent = formattedContent;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public MessageStatus getStatus() {
        return status;
    }
    
    public void setStatus(MessageStatus status) {
        this.status = status;
    }
    
    public String getMediaUrl() {
        return mediaUrl;
    }
    
    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }
    
    public String getClientMessageId() {
        return clientMessageId;
    }
    
    public void setClientMessageId(String clientMessageId) {
        this.clientMessageId = clientMessageId;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }
    
    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
    
    public LocalDateTime getReadAt() {
        return readAt;
    }
    
    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }
    
    public Long getMeetupId() {
        return meetupId;
    }
    
    public void setMeetupId(Long meetupId) {
        this.meetupId = meetupId;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public Meetup getMeetup() {
        return meetup;
    }
    
    public void setMeetup(Meetup meetup) {
        this.meetup = meetup;
        if (meetup != null) {
            this.meetupId = meetup.getId();
        }
    }
    
    public User getSender() {
        return sender;
    }
    
    public void setSender(User sender) {
        this.sender = sender;
        if (sender != null) {
            this.senderId = sender.getId();
        }
    }
    
    /**
     * 메시지를 전송됨 상태로 표시
     */
    public void markAsDelivered() {
        this.status = MessageStatus.DELIVERED;
        this.deliveredAt = LocalDateTime.now();
    }
    
    /**
     * 메시지를 읽음 상태로 표시
     */
    public void markAsRead() {
        this.status = MessageStatus.READ;
        this.readAt = LocalDateTime.now();
        if (this.deliveredAt == null) {
            this.deliveredAt = LocalDateTime.now();
        }
    }
    
    /**
     * 메시지를 실패 상태로 표시
     */
    public void markAsFailed() {
        this.status = MessageStatus.FAILED;
    }
    
    /**
     * 메시지 전송자 이름 반환 (JSON 직렬화용)
     */
    @Transient
    public String getSenderName() {
        return sender != null ? sender.getUsername() : null;
    }
    
    /**
     * 타임스탬프 반환 (JSON 직렬화용)
     */
    @Transient
    public LocalDateTime getTimestamp() {
        return sentAt;
    }
}