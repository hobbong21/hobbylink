package com.hobbylink.service;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 브라우저 알림 브로드캐스트 서비스
 */
@Service
public class NotificationBroadcastService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationBroadcastService.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private ConnectionManagerService connectionManagerService;
    
    @Autowired
    private MeetupParticipationService meetupParticipationService;
    
    /**
     * 새 메시지 알림 브로드캐스트
     * @param message 새 메시지
     */
    public void broadcastNewMessageNotification(ChatMessage message) {
        try {
            // 미팅 참가자 목록 조회
            List<User> participants = meetupParticipationService.getMeetupParticipants(message.getMeetupId());
            
            // 온라인 사용자 목록 조회
            List<User> onlineUsers = connectionManagerService.getOnlineUsers(message.getMeetupId());
            
            for (User participant : participants) {
                // 메시지 발신자는 제외
                if (participant.getId().equals(message.getSenderId())) {
                    continue;
                }
                
                // 알림 생성
                MessageNotification notification = new MessageNotification(
                    message.getId(),
                    message.getClientMessageId(),
                    message.getMeetupId(),
                    message.getSender().getUsername(),
                    message.getContent(),
                    message.getSentAt(),
                    isUserOnline(participant, onlineUsers)
                );
                
                // 사용자별 알림 전송
                messagingTemplate.convertAndSendToUser(
                    participant.getId().toString(),
                    "/queue/notifications",
                    notification
                );
                
                logger.debug("Sent notification to user {} for message from {}", 
                           participant.getId(), message.getSender().getUsername());
            }
            
        } catch (Exception e) {
            logger.error("Error broadcasting new message notification: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 타이핑 알림 브로드캐스트
     * @param meetupId 미팅 ID
     * @param typingUsers 타이핑 중인 사용자 목록
     */
    public void broadcastTypingNotification(Long meetupId, List<User> typingUsers) {
        try {
            TypingNotification notification = new TypingNotification(
                meetupId,
                typingUsers,
                generateTypingMessage(typingUsers),
                System.currentTimeMillis()
            );
            
            // 미팅 참가자들에게 브로드캐스트
            messagingTemplate.convertAndSend(
                "/topic/meetup/" + meetupId + "/typing-notifications",
                notification
            );
            
        } catch (Exception e) {
            logger.error("Error broadcasting typing notification: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 사용자 상태 변경 알림 브로드캐스트
     * @param meetupId 미팅 ID
     * @param user 사용자
     * @param status 새로운 상태 (online, offline, away)
     */
    public void broadcastUserStatusNotification(Long meetupId, User user, String status) {
        try {
            UserStatusNotification notification = new UserStatusNotification(
                meetupId,
                user.getId(),
                user.getUsername(),
                status,
                System.currentTimeMillis()
            );
            
            // 미팅 참가자들에게 브로드캐스트
            messagingTemplate.convertAndSend(
                "/topic/meetup/" + meetupId + "/user-status",
                notification
            );
            
        } catch (Exception e) {
            logger.error("Error broadcasting user status notification: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 읽지 않은 메시지 수 업데이트 알림
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     * @param unreadCount 읽지 않은 메시지 수
     */
    public void broadcastUnreadCountUpdate(Long userId, Long meetupId, long unreadCount) {
        try {
            UnreadCountNotification notification = new UnreadCountNotification(
                meetupId,
                unreadCount,
                System.currentTimeMillis()
            );
            
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/unread-count",
                notification
            );
            
        } catch (Exception e) {
            logger.error("Error broadcasting unread count update: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 연결 상태 알림 브로드캐스트
     * @param meetupId 미팅 ID
     * @param status 연결 상태
     * @param message 상태 메시지
     */
    public void broadcastConnectionStatus(Long meetupId, String status, String message) {
        try {
            ConnectionStatusNotification notification = new ConnectionStatusNotification(
                meetupId,
                status,
                message,
                System.currentTimeMillis()
            );
            
            messagingTemplate.convertAndSend(
                "/topic/meetup/" + meetupId + "/connection-status",
                notification
            );
            
        } catch (Exception e) {
            logger.error("Error broadcasting connection status: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 사용자가 온라인인지 확인
     */
    private boolean isUserOnline(User user, List<User> onlineUsers) {
        return onlineUsers.stream().anyMatch(onlineUser -> onlineUser.getId().equals(user.getId()));
    }
    
    /**
     * 타이핑 메시지 생성
     */
    private String generateTypingMessage(List<User> typingUsers) {
        if (typingUsers.isEmpty()) {
            return "";
        } else if (typingUsers.size() == 1) {
            return typingUsers.get(0).getUsername() + "님이 입력 중...";
        } else if (typingUsers.size() <= 3) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < typingUsers.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(typingUsers.get(i).getUsername());
            }
            sb.append("님이 입력 중...");
            return sb.toString();
        } else {
            return typingUsers.size() + "명이 입력 중...";
        }
    }
    
    /**
     * 메시지 알림 클래스
     */
    public static class MessageNotification {
        private Long messageId;
        private String clientMessageId;
        private Long meetupId;
        private String senderName;
        private String content;
        private LocalDateTime timestamp;
        private boolean senderOnline;
        private String type = "NEW_MESSAGE";
        
        public MessageNotification(Long messageId, String clientMessageId, Long meetupId,
                                 String senderName, String content, LocalDateTime timestamp, boolean senderOnline) {
            this.messageId = messageId;
            this.clientMessageId = clientMessageId;
            this.meetupId = meetupId;
            this.senderName = senderName;
            this.content = content;
            this.timestamp = timestamp;
            this.senderOnline = senderOnline;
        }
        
        // Getters and Setters
        public Long getMessageId() { return messageId; }
        public void setMessageId(Long messageId) { this.messageId = messageId; }
        
        public String getClientMessageId() { return clientMessageId; }
        public void setClientMessageId(String clientMessageId) { this.clientMessageId = clientMessageId; }
        
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public boolean isSenderOnline() { return senderOnline; }
        public void setSenderOnline(boolean senderOnline) { this.senderOnline = senderOnline; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
    
    /**
     * 타이핑 알림 클래스
     */
    public static class TypingNotification {
        private Long meetupId;
        private List<User> typingUsers;
        private String message;
        private long timestamp;
        private String type = "TYPING";
        
        public TypingNotification(Long meetupId, List<User> typingUsers, String message, long timestamp) {
            this.meetupId = meetupId;
            this.typingUsers = typingUsers;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public List<User> getTypingUsers() { return typingUsers; }
        public void setTypingUsers(List<User> typingUsers) { this.typingUsers = typingUsers; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
    
    /**
     * 사용자 상태 알림 클래스
     */
    public static class UserStatusNotification {
        private Long meetupId;
        private Long userId;
        private String username;
        private String status;
        private long timestamp;
        private String type = "USER_STATUS";
        
        public UserStatusNotification(Long meetupId, Long userId, String username, String status, long timestamp) {
            this.meetupId = meetupId;
            this.userId = userId;
            this.username = username;
            this.status = status;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
    
    /**
     * 읽지 않은 메시지 수 알림 클래스
     */
    public static class UnreadCountNotification {
        private Long meetupId;
        private long unreadCount;
        private long timestamp;
        private String type = "UNREAD_COUNT";
        
        public UnreadCountNotification(Long meetupId, long unreadCount, long timestamp) {
            this.meetupId = meetupId;
            this.unreadCount = unreadCount;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public long getUnreadCount() { return unreadCount; }
        public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
    
    /**
     * 연결 상태 알림 클래스
     */
    public static class ConnectionStatusNotification {
        private Long meetupId;
        private String status;
        private String message;
        private long timestamp;
        private String type = "CONNECTION_STATUS";
        
        public ConnectionStatusNotification(Long meetupId, String status, String message, long timestamp) {
            this.meetupId = meetupId;
            this.status = status;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
}