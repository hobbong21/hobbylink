package com.hobbylink.service;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.MessageStatus;
import com.hobbylink.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 메시지 동기화 서비스
 */
@Service
@Transactional
public class MessageSyncService {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageSyncService.class);
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private MessageStatusService messageStatusService;
    
    /**
     * 재연결 시 놓친 메시지 동기화
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     * @param lastSyncTime 마지막 동기화 시간
     * @return 동기화된 메시지 수
     */
    public int syncMissedMessages(Long meetupId, Long userId, LocalDateTime lastSyncTime) {
        try {
            logger.info("Starting message sync for user {} in meetup {} since {}", 
                       userId, meetupId, lastSyncTime);
            
            // 마지막 동기화 시간 이후의 메시지 조회
            List<ChatMessage> missedMessages = chatMessageRepository
                    .findByMeetupIdAndSentAtAfterOrderBySentAtAsc(meetupId, lastSyncTime);
            
            if (missedMessages.isEmpty()) {
                logger.debug("No missed messages found for user {} in meetup {}", userId, meetupId);
                return 0;
            }
            
            // 중복 메시지 제거 (클라이언트 메시지 ID 기준)
            List<ChatMessage> uniqueMessages = removeDuplicateMessages(missedMessages);
            
            // 사용자에게 놓친 메시지 전송
            SyncResponse syncResponse = new SyncResponse(
                meetupId,
                uniqueMessages,
                lastSyncTime,
                LocalDateTime.now(),
                uniqueMessages.size()
            );
            
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/message-sync",
                syncResponse
            );
            
            // 읽지 않은 메시지를 읽음으로 표시 (자신이 보낸 메시지 제외)
            markMissedMessagesAsRead(uniqueMessages, userId);
            
            logger.info("Synced {} missed messages for user {} in meetup {}", 
                       uniqueMessages.size(), userId, meetupId);
            
            return uniqueMessages.size();
            
        } catch (Exception e) {
            logger.error("Error syncing missed messages for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 특정 시간 범위의 메시지 동기화
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     * @param startTime 시작 시간
     * @param endTime 종료 시간
     * @return 동기화 응답
     */
    public SyncResponse syncMessagesByTimeRange(Long meetupId, Long userId, 
                                               LocalDateTime startTime, LocalDateTime endTime) {
        try {
            List<ChatMessage> messages = chatMessageRepository
                    .findByMeetupIdAndSentAtBetweenOrderBySentAtAsc(meetupId, startTime, endTime);
            
            List<ChatMessage> uniqueMessages = removeDuplicateMessages(messages);
            
            return new SyncResponse(
                meetupId,
                uniqueMessages,
                startTime,
                endTime,
                uniqueMessages.size()
            );
            
        } catch (Exception e) {
            logger.error("Error syncing messages by time range for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage(), e);
            return new SyncResponse(meetupId, List.of(), startTime, endTime, 0);
        }
    }
    
    /**
     * 메시지 상태 동기화
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     * @param clientMessageIds 클라이언트 메시지 ID 목록
     * @return 상태 동기화 응답
     */
    public StatusSyncResponse syncMessageStatuses(Long meetupId, Long userId, List<String> clientMessageIds) {
        try {
            List<MessageStatusInfo> statusInfos = clientMessageIds.stream()
                    .map(clientMessageId -> {
                        ChatMessage message = chatMessageRepository
                                .findBySenderIdAndClientMessageId(userId, clientMessageId)
                                .orElse(null);
                        
                        if (message != null) {
                            return new MessageStatusInfo(
                                clientMessageId,
                                message.getId(),
                                message.getStatus(),
                                message.getDeliveredAt(),
                                message.getReadAt()
                            );
                        } else {
                            return new MessageStatusInfo(
                                clientMessageId,
                                null,
                                MessageStatus.FAILED,
                                null,
                                null
                            );
                        }
                    })
                    .collect(Collectors.toList());
            
            return new StatusSyncResponse(meetupId, statusInfos, statusInfos.size());
            
        } catch (Exception e) {
            logger.error("Error syncing message statuses for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage(), e);
            return new StatusSyncResponse(meetupId, List.of(), 0);
        }
    }
    
    /**
     * 전체 채팅 히스토리 동기화 (초기 로드용)
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     * @param limit 메시지 수 제한
     * @return 동기화 응답
     */
    public SyncResponse syncFullChatHistory(Long meetupId, Long userId, int limit) {
        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<ChatMessage> messages = chatMessageRepository
                    .findByMeetupIdOrderBySentAtDesc(meetupId, pageable)
                    .getContent();
            
            // 시간순으로 정렬 (최신 메시지가 마지막)
            messages.sort((m1, m2) -> m1.getSentAt().compareTo(m2.getSentAt()));
            
            List<ChatMessage> uniqueMessages = removeDuplicateMessages(messages);
            
            // 읽지 않은 메시지를 읽음으로 표시
            markMissedMessagesAsRead(uniqueMessages, userId);
            
            LocalDateTime oldestTime = uniqueMessages.isEmpty() ? 
                LocalDateTime.now() : uniqueMessages.get(0).getSentAt();
            LocalDateTime newestTime = uniqueMessages.isEmpty() ? 
                LocalDateTime.now() : uniqueMessages.get(uniqueMessages.size() - 1).getSentAt();
            
            return new SyncResponse(
                meetupId,
                uniqueMessages,
                oldestTime,
                newestTime,
                uniqueMessages.size()
            );
            
        } catch (Exception e) {
            logger.error("Error syncing full chat history for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage(), e);
            return new SyncResponse(meetupId, List.of(), LocalDateTime.now(), LocalDateTime.now(), 0);
        }
    }
    
    /**
     * 중복 메시지 제거 (클라이언트 메시지 ID 기준)
     */
    private List<ChatMessage> removeDuplicateMessages(List<ChatMessage> messages) {
        Set<String> seenClientIds = messages.stream()
                .filter(msg -> msg.getClientMessageId() != null)
                .map(ChatMessage::getClientMessageId)
                .collect(Collectors.toSet());
        
        return messages.stream()
                .filter(msg -> {
                    if (msg.getClientMessageId() == null) {
                        return true; // 클라이언트 ID가 없는 메시지는 포함
                    }
                    
                    if (seenClientIds.contains(msg.getClientMessageId())) {
                        seenClientIds.remove(msg.getClientMessageId());
                        return true; // 첫 번째 발견된 메시지만 포함
                    }
                    
                    return false; // 중복 메시지 제외
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 놓친 메시지들을 읽음으로 표시 (자신이 보낸 메시지 제외)
     */
    private void markMissedMessagesAsRead(List<ChatMessage> messages, Long userId) {
        try {
            List<Long> messageIds = messages.stream()
                    .filter(msg -> !msg.getSenderId().equals(userId)) // 자신이 보낸 메시지 제외
                    .filter(msg -> msg.getStatus() != MessageStatus.READ) // 이미 읽은 메시지 제외
                    .map(ChatMessage::getId)
                    .collect(Collectors.toList());
            
            if (!messageIds.isEmpty()) {
                messageStatusService.markMessagesAsRead(
                    messages.get(0).getMeetupId(), 
                    userId, 
                    messageIds
                );
            }
            
        } catch (Exception e) {
            logger.error("Error marking missed messages as read: {}", e.getMessage());
        }
    }
    
    /**
     * 동기화 응답 클래스
     */
    public static class SyncResponse {
        private Long meetupId;
        private List<ChatMessage> messages;
        private LocalDateTime syncStartTime;
        private LocalDateTime syncEndTime;
        private int messageCount;
        
        public SyncResponse(Long meetupId, List<ChatMessage> messages, 
                           LocalDateTime syncStartTime, LocalDateTime syncEndTime, int messageCount) {
            this.meetupId = meetupId;
            this.messages = messages;
            this.syncStartTime = syncStartTime;
            this.syncEndTime = syncEndTime;
            this.messageCount = messageCount;
        }
        
        // Getters and Setters
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public List<ChatMessage> getMessages() { return messages; }
        public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
        
        public LocalDateTime getSyncStartTime() { return syncStartTime; }
        public void setSyncStartTime(LocalDateTime syncStartTime) { this.syncStartTime = syncStartTime; }
        
        public LocalDateTime getSyncEndTime() { return syncEndTime; }
        public void setSyncEndTime(LocalDateTime syncEndTime) { this.syncEndTime = syncEndTime; }
        
        public int getMessageCount() { return messageCount; }
        public void setMessageCount(int messageCount) { this.messageCount = messageCount; }
    }
    
    /**
     * 상태 동기화 응답 클래스
     */
    public static class StatusSyncResponse {
        private Long meetupId;
        private List<MessageStatusInfo> statusInfos;
        private int count;
        
        public StatusSyncResponse(Long meetupId, List<MessageStatusInfo> statusInfos, int count) {
            this.meetupId = meetupId;
            this.statusInfos = statusInfos;
            this.count = count;
        }
        
        // Getters and Setters
        public Long getMeetupId() { return meetupId; }
        public void setMeetupId(Long meetupId) { this.meetupId = meetupId; }
        
        public List<MessageStatusInfo> getStatusInfos() { return statusInfos; }
        public void setStatusInfos(List<MessageStatusInfo> statusInfos) { this.statusInfos = statusInfos; }
        
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
    }
    
    /**
     * 메시지 상태 정보 클래스
     */
    public static class MessageStatusInfo {
        private String clientMessageId;
        private Long messageId;
        private MessageStatus status;
        private LocalDateTime deliveredAt;
        private LocalDateTime readAt;
        
        public MessageStatusInfo(String clientMessageId, Long messageId, MessageStatus status,
                               LocalDateTime deliveredAt, LocalDateTime readAt) {
            this.clientMessageId = clientMessageId;
            this.messageId = messageId;
            this.status = status;
            this.deliveredAt = deliveredAt;
            this.readAt = readAt;
        }
        
        // Getters and Setters
        public String getClientMessageId() { return clientMessageId; }
        public void setClientMessageId(String clientMessageId) { this.clientMessageId = clientMessageId; }
        
        public Long getMessageId() { return messageId; }
        public void setMessageId(Long messageId) { this.messageId = messageId; }
        
        public MessageStatus getStatus() { return status; }
        public void setStatus(MessageStatus status) { this.status = status; }
        
        public LocalDateTime getDeliveredAt() { return deliveredAt; }
        public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
        
        public LocalDateTime getReadAt() { return readAt; }
        public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    }
}