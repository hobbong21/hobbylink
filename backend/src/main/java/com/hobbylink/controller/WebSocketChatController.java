package com.hobbylink.controller;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.MessageStatus;
import com.hobbylink.model.TypingRequest;
import com.hobbylink.model.User;
import com.hobbylink.model.Meetup;
import com.hobbylink.service.ChatService;
import com.hobbylink.service.ConnectionManagerService;
import com.hobbylink.service.MeetupService;
import com.hobbylink.service.MessageStatusService;
import com.hobbylink.service.MessageRetryService;
import com.hobbylink.service.MessageSyncService;
import com.hobbylink.service.NotificationBroadcastService;
import com.hobbylink.service.UnreadMessageTrackingService;
import com.hobbylink.service.MessageFormattingService;
import com.hobbylink.service.TypingIndicatorService;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Controller
public class WebSocketChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private MeetupService meetupService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private TypingIndicatorService typingIndicatorService;
    
    @Autowired
    private MessageStatusService messageStatusService;
    
    @Autowired
    private ConnectionManagerService connectionManagerService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private MessageRetryService messageRetryService;
    
    @Autowired
    private MessageSyncService messageSyncService;
    
    @Autowired
    private NotificationBroadcastService notificationBroadcastService;
    
    @Autowired
    private UnreadMessageTrackingService unreadMessageTrackingService;
    
    @MessageMapping("/chat/{meetupId}/message")
    @SendTo("/topic/meetup/{meetupId}/messages")
    public ChatMessage sendMessage(@DestinationVariable Long meetupId, Map<String, Object> message) {
        try {
            String content = (String) message.get("content");
            Long senderId = Long.valueOf(message.get("senderId").toString());
            String clientMessageId = (String) message.get("clientMessageId");
            
            Optional<Meetup> meetupOpt = meetupService.getMeetupById(meetupId);
            Optional<User> senderOpt = userService.getUserById(senderId);
            
            if (!meetupOpt.isPresent()) {
                throw new RuntimeException("Meetup not found");
            }
            if (!senderOpt.isPresent()) {
                throw new RuntimeException("User not found");
            }
            
            Meetup meetup = meetupOpt.get();
            User sender = senderOpt.get();
            
            // Save message to database
            ChatMessage chatMessage = chatService.sendMessage(content, meetup, sender);
            
            // Set client message ID if provided
            if (clientMessageId != null && !clientMessageId.isEmpty()) {
                chatMessage.setClientMessageId(clientMessageId);
                chatMessage = chatService.updateMessage(chatMessage);
            }
            
            // Mark message as delivered
            messageStatusService.markAsDelivered(chatMessage.getId());
            
            // Stop typing indicator for sender
            typingIndicatorService.stopTyping(meetupId, senderId);
            
            // Send notification to other participants
            notificationBroadcastService.broadcastNewMessageNotification(chatMessage);
            
            // Update unread message counts
            unreadMessageTrackingService.handleNewMessage(chatMessage);
            
            return chatMessage;
        } catch (Exception e) {
            // Return error message
            ChatMessage errorMessage = new ChatMessage();
            errorMessage.setContent("Error sending message: " + e.getMessage());
            errorMessage.setStatus(MessageStatus.FAILED);
            return errorMessage;
        }
    }
    
    @MessageMapping("/chat/{meetupId}/typing")
    @SendTo("/topic/meetup/{meetupId}/typing")
    public TypingIndicatorService.TypingIndicatorResponse handleTyping(
            @DestinationVariable Long meetupId, TypingRequest request) {
        try {
            if (request.isTyping()) {
                typingIndicatorService.startTyping(meetupId, request.getUserId());
            } else {
                typingIndicatorService.stopTyping(meetupId, request.getUserId());
            }
            
            TypingIndicatorService.TypingIndicatorResponse response = 
                typingIndicatorService.getTypingIndicatorResponse(meetupId);
            
            // Broadcast typing notification
            notificationBroadcastService.broadcastTypingNotification(
                meetupId, response.getTypingUsers());
            
            return response;
        } catch (Exception e) {
            System.err.println("Error handling typing indicator: " + e.getMessage());
            return new TypingIndicatorService.TypingIndicatorResponse(meetupId, List.of(), "");
        }
    }
    
    @MessageMapping("/chat/{meetupId}/status")
    public void updateMessageStatus(@DestinationVariable Long meetupId, Map<String, Object> statusUpdate) {
        try {
            Long messageId = Long.valueOf(statusUpdate.get("messageId").toString());
            String status = (String) statusUpdate.get("status");
            Long userId = Long.valueOf(statusUpdate.get("userId").toString());
            
            ChatMessage updatedMessage = null;
            
            switch (status.toUpperCase()) {
                case "DELIVERED":
                    updatedMessage = messageStatusService.markAsDelivered(messageId).orElse(null);
                    break;
                case "READ":
                    updatedMessage = messageStatusService.markAsRead(messageId).orElse(null);
                    break;
                case "FAILED":
                    updatedMessage = messageStatusService.markAsFailed(messageId).orElse(null);
                    break;
            }
            
            if (updatedMessage != null) {
                // Send status update to message sender by userId-based destination
                messagingTemplate.convertAndSend(
                    "/user/" + updatedMessage.getSender().getId() + "/queue/message-status",
                    new MessageStatusResponse(updatedMessage.getId(), updatedMessage.getStatus(),
                                              updatedMessage.getClientMessageId())
                );
            }
        } catch (Exception e) {
            System.err.println("Error updating message status: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/bulk-read")
    public void markMessagesAsRead(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            @SuppressWarnings("unchecked")
            List<Long> messageIds = (List<Long>) request.get("messageIds");
            
            int updatedCount = messageStatusService.markMessagesAsRead(meetupId, userId, messageIds);
            
            if (updatedCount > 0) {
                // Notify about bulk read status update
                messagingTemplate.convertAndSend(
                    "/topic/meetup/" + meetupId + "/bulk-status",
                    new BulkStatusResponse(messageIds, MessageStatus.READ, updatedCount)
                );
                
                // Update unread message counts
                unreadMessageTrackingService.handleMessagesRead(userId, meetupId, messageIds);
            }
        } catch (Exception e) {
            System.err.println("Error marking messages as read: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/join")
    @SendTo("/topic/meetup/{meetupId}/users")
    public ConnectionManagerService.OnlineUsersResponse handleUserJoin(
            @DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String sessionId = (String) request.get("sessionId");
            
            // Add user session
            connectionManagerService.addUserSession(sessionId, userId, meetupId);
            
            // Handle user entering chat (mark messages as read)
            unreadMessageTrackingService.handleUserEnterChat(userId, meetupId);
            
            // Return updated online users list
            return connectionManagerService.getOnlineUsersResponse(meetupId);
        } catch (Exception e) {
            System.err.println("Error handling user join: " + e.getMessage());
            return new ConnectionManagerService.OnlineUsersResponse(meetupId, List.of(), 0);
        }
    }
    
    @MessageMapping("/chat/{meetupId}/leave")
    @SendTo("/topic/meetup/{meetupId}/users")
    public ConnectionManagerService.OnlineUsersResponse handleUserLeave(
            @DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String sessionId = (String) request.get("sessionId");
            
            // Remove user session
            connectionManagerService.removeUserSession(sessionId);
            
            // Clean up typing status
            typingIndicatorService.cleanupUserTypingStatus(meetupId, userId);
            
            // Handle user leaving chat
            unreadMessageTrackingService.handleUserLeaveChat(userId, meetupId);
            
            // Return updated online users list
            return connectionManagerService.getOnlineUsersResponse(meetupId);
        } catch (Exception e) {
            System.err.println("Error handling user leave: " + e.getMessage());
            return new ConnectionManagerService.OnlineUsersResponse(meetupId, List.of(), 0);
        }
    }
    
    @MessageMapping("/chat/{meetupId}/heartbeat")
    public void handleHeartbeat(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            String sessionId = (String) request.get("sessionId");
            
            // Update user activity
            connectionManagerService.updateUserActivity(sessionId);
        } catch (Exception e) {
            System.err.println("Error handling heartbeat: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/retry")
    public void retryMessage(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            String clientMessageId = (String) request.get("clientMessageId");
            Long senderId = Long.valueOf(request.get("senderId").toString());
            
            // 메시지 재시도 시작
            messageRetryService.retryMessage(clientMessageId, senderId, meetupId);
            
        } catch (Exception e) {
            System.err.println("Error handling message retry: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/cancel-retry")
    public void cancelRetry(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            String clientMessageId = (String) request.get("clientMessageId");
            Long senderId = Long.valueOf(request.get("senderId").toString());
            
            // 메시지 재시도 취소
            messageRetryService.cancelRetry(clientMessageId, senderId);
            
        } catch (Exception e) {
            System.err.println("Error handling retry cancellation: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/sync")
    public void syncMessages(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String lastSyncTimeStr = (String) request.get("lastSyncTime");
            
            if (lastSyncTimeStr != null && !lastSyncTimeStr.isEmpty()) {
                // 특정 시간 이후 메시지 동기화
                LocalDateTime lastSyncTime = LocalDateTime.parse(lastSyncTimeStr);
                messageSyncService.syncMissedMessages(meetupId, userId, lastSyncTime);
            } else {
                // 전체 채팅 히스토리 동기화
                messageSyncService.syncFullChatHistory(meetupId, userId, 50);
            }
            
        } catch (Exception e) {
            System.err.println("Error handling message sync: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/sync-status")
    public void syncMessageStatuses(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            @SuppressWarnings("unchecked")
            List<String> clientMessageIds = (List<String>) request.get("clientMessageIds");
            
            MessageSyncService.StatusSyncResponse response = 
                messageSyncService.syncMessageStatuses(meetupId, userId, clientMessageIds);
            
            // 사용자에게 상태 동기화 결과 전송 (userId 기반 경로)
            messagingTemplate.convertAndSend(
                "/user/" + userId + "/queue/status-sync",
                response
            );
            
        } catch (Exception e) {
            System.err.println("Error handling status sync: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/{meetupId}/unread-count")
    public void getUnreadCount(@DestinationVariable Long meetupId, Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            // Get unread count for specific meetup
            long unreadCount = unreadMessageTrackingService.getUnreadMessageCount(userId, meetupId);
            
            // Send unread count to user
            notificationBroadcastService.broadcastUnreadCountUpdate(userId, meetupId, unreadCount);
            
        } catch (Exception e) {
            System.err.println("Error getting unread count: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/all-unread-counts")
    public void getAllUnreadCounts(Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            // Get all unread counts for user
            Map<Long, Long> allUnreadCounts = unreadMessageTrackingService.getAllUnreadMessageCounts(userId);
            
            UnreadMessageTrackingService.UnreadCountResponse response = 
                new UnreadMessageTrackingService.UnreadCountResponse(userId, allUnreadCounts);
            
            // Send all unread counts to user (userId 기반 경로)
            messagingTemplate.convertAndSend(
                "/user/" + userId + "/queue/all-unread-counts",
                response
            );
            
        } catch (Exception e) {
            System.err.println("Error getting all unread counts: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/preview-formatting")
    public void previewMessageFormatting(Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long userId = Long.valueOf(request.get("userId").toString());
            
            // Generate formatting preview
            MessageFormattingService.FormattedMessageResponse preview = 
                chatService.previewMessageFormatting(content);
            
            // Send preview to user (userId 기반 경로)
            messagingTemplate.convertAndSend(
                "/user/" + userId + "/queue/formatting-preview",
                preview
            );
            
        } catch (Exception e) {
            System.err.println("Error previewing message formatting: " + e.getMessage());
        }
    }
    
    @MessageMapping("/chat/validate-message")
    public void validateMessage(Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long userId = Long.valueOf(request.get("userId").toString());
            
            // Validate message content
            MessageFormattingService.ValidationResult validation = 
                chatService.validateMessageContent(content);
            
            // Send validation result to user (userId 기반 경로)
            messagingTemplate.convertAndSend(
                "/user/" + userId + "/queue/message-validation",
                validation
            );
            
        } catch (Exception e) {
            System.err.println("Error validating message: " + e.getMessage());
        }
    }
    
    // Response classes
    public static class MessageStatusResponse {
        private Long messageId;
        private MessageStatus status;
        private String clientMessageId;
        
        public MessageStatusResponse(Long messageId, MessageStatus status, String clientMessageId) {
            this.messageId = messageId;
            this.status = status;
            this.clientMessageId = clientMessageId;
        }
        
        // Getters and Setters
        public Long getMessageId() { return messageId; }
        public void setMessageId(Long messageId) { this.messageId = messageId; }
        
        public MessageStatus getStatus() { return status; }
        public void setStatus(MessageStatus status) { this.status = status; }
        
        public String getClientMessageId() { return clientMessageId; }
        public void setClientMessageId(String clientMessageId) { this.clientMessageId = clientMessageId; }
    }
    
    public static class BulkStatusResponse {
        private List<Long> messageIds;
        private MessageStatus status;
        private int updatedCount;
        
        public BulkStatusResponse(List<Long> messageIds, MessageStatus status, int updatedCount) {
            this.messageIds = messageIds;
            this.status = status;
            this.updatedCount = updatedCount;
        }
        
        // Getters and Setters
        public List<Long> getMessageIds() { return messageIds; }
        public void setMessageIds(List<Long> messageIds) { this.messageIds = messageIds; }
        
        public MessageStatus getStatus() { return status; }
        public void setStatus(MessageStatus status) { this.status = status; }
        
        public int getUpdatedCount() { return updatedCount; }
        public void setUpdatedCount(int updatedCount) { this.updatedCount = updatedCount; }
    }
}