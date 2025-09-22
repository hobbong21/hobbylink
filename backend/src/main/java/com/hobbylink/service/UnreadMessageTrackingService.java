package com.hobbylink.service;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.MessageStatus;
import com.hobbylink.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 읽지 않은 메시지 추적 서비스
 */
@Service
@Transactional
public class UnreadMessageTrackingService {
    
    private static final Logger logger = LoggerFactory.getLogger(UnreadMessageTrackingService.class);
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private NotificationBroadcastService notificationBroadcastService;
    
    @Autowired
    private MeetupParticipationService meetupParticipationService;
    
    // 사용자별 읽지 않은 메시지 수 캐시 (userId -> meetupId -> count)
    private final Map<Long, Map<Long, Long>> unreadCountCache = new ConcurrentHashMap<>();
    
    // 사용자별 마지막 읽은 메시지 시간 (userId -> meetupId -> timestamp)
    private final Map<Long, Map<Long, LocalDateTime>> lastReadTimeCache = new ConcurrentHashMap<>();
    
    /**
     * 특정 미팅에서 사용자의 읽지 않은 메시지 수 조회
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     * @return 읽지 않은 메시지 수
     */
    public long getUnreadMessageCount(Long userId, Long meetupId) {
        try {
            // 캐시에서 먼저 확인
            Map<Long, Long> userUnreadCounts = unreadCountCache.get(userId);
            if (userUnreadCounts != null && userUnreadCounts.containsKey(meetupId)) {
                return userUnreadCounts.get(meetupId);
            }
            
            // 데이터베이스에서 조회
            long count = chatMessageRepository.countByMeetupIdAndSenderIdNotAndStatusNot(
                meetupId, userId, MessageStatus.READ);
            
            // 캐시 업데이트
            updateUnreadCountCache(userId, meetupId, count);
            
            return count;
            
        } catch (Exception e) {
            logger.error("Error getting unread message count for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 사용자의 모든 미팅에서 읽지 않은 메시지 수 조회
     * @param userId 사용자 ID
     * @return 미팅별 읽지 않은 메시지 수 맵
     */
    public Map<Long, Long> getAllUnreadMessageCounts(Long userId) {
        try {
            Map<Long, Long> unreadCounts = new HashMap<>();
            
            // 사용자가 참여한 모든 미팅 조회
            List<Long> meetupIds = meetupParticipationService.getUserMeetupIds(userId);
            
            for (Long meetupId : meetupIds) {
                long count = getUnreadMessageCount(userId, meetupId);
                if (count > 0) {
                    unreadCounts.put(meetupId, count);
                }
            }
            
            return unreadCounts;
            
        } catch (Exception e) {
            logger.error("Error getting all unread message counts for user {}: {}", userId, e.getMessage());
            return new HashMap<>();
        }
    }
    
    /**
     * 새 메시지 도착 시 읽지 않은 메시지 수 업데이트
     * @param message 새 메시지
     */
    public void handleNewMessage(ChatMessage message) {
        try {
            Long meetupId = message.getMeetupId();
            Long senderId = message.getSenderId();
            
            // 미팅 참가자들의 읽지 않은 메시지 수 업데이트
            List<Long> participantIds = meetupParticipationService.getMeetupParticipantIds(meetupId);
            
            for (Long participantId : participantIds) {
                // 메시지 발신자는 제외
                if (participantId.equals(senderId)) {
                    continue;
                }
                
                // 읽지 않은 메시지 수 증가
                incrementUnreadCount(participantId, meetupId);
                
                // 알림 전송
                long newCount = getUnreadMessageCount(participantId, meetupId);
                notificationBroadcastService.broadcastUnreadCountUpdate(participantId, meetupId, newCount);
            }
            
        } catch (Exception e) {
            logger.error("Error handling new message for unread tracking: {}", e.getMessage());
        }
    }
    
    /**
     * 메시지를 읽음으로 표시할 때 읽지 않은 메시지 수 업데이트
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     * @param messageIds 읽은 메시지 ID 목록
     */
    public void handleMessagesRead(Long userId, Long meetupId, List<Long> messageIds) {
        try {
            // 읽지 않은 메시지 수 재계산
            long newCount = chatMessageRepository.countByMeetupIdAndSenderIdNotAndStatusNot(
                meetupId, userId, MessageStatus.READ);
            
            // 캐시 업데이트
            updateUnreadCountCache(userId, meetupId, newCount);
            
            // 마지막 읽은 시간 업데이트
            updateLastReadTime(userId, meetupId, LocalDateTime.now());
            
            // 알림 전송
            notificationBroadcastService.broadcastUnreadCountUpdate(userId, meetupId, newCount);
            
            logger.debug("Updated unread count for user {} in meetup {}: {}", userId, meetupId, newCount);
            
        } catch (Exception e) {
            logger.error("Error handling messages read for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage());
        }
    }
    
    /**
     * 사용자가 채팅방에 입장할 때 읽지 않은 메시지 수 초기화
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     */
    public void handleUserEnterChat(Long userId, Long meetupId) {
        try {
            // 현재 읽지 않은 메시지 수 조회
            long currentCount = getUnreadMessageCount(userId, meetupId);
            
            if (currentCount > 0) {
                // 모든 메시지를 읽음으로 표시
                int updatedCount = chatMessageRepository.markAllMessagesAsReadForUser(meetupId, userId);
                
                // 캐시 업데이트
                updateUnreadCountCache(userId, meetupId, 0L);
                updateLastReadTime(userId, meetupId, LocalDateTime.now());
                
                // 알림 전송
                notificationBroadcastService.broadcastUnreadCountUpdate(userId, meetupId, 0L);
                
                logger.info("Marked {} messages as read for user {} entering meetup {}", 
                           updatedCount, userId, meetupId);
            }
            
        } catch (Exception e) {
            logger.error("Error handling user enter chat for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage());
        }
    }
    
    /**
     * 사용자가 채팅방을 떠날 때 마지막 읽은 시간 업데이트
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     */
    public void handleUserLeaveChat(Long userId, Long meetupId) {
        try {
            // 마지막 읽은 시간 업데이트
            updateLastReadTime(userId, meetupId, LocalDateTime.now());
            
            logger.debug("Updated last read time for user {} leaving meetup {}", userId, meetupId);
            
        } catch (Exception e) {
            logger.error("Error handling user leave chat for user {} in meetup {}: {}", 
                        userId, meetupId, e.getMessage());
        }
    }
    
    /**
     * 읽지 않은 메시지 수 증가
     */
    private void incrementUnreadCount(Long userId, Long meetupId) {
        Map<Long, Long> userUnreadCounts = unreadCountCache.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        userUnreadCounts.merge(meetupId, 1L, Long::sum);
    }
    
    /**
     * 읽지 않은 메시지 수 캐시 업데이트
     */
    private void updateUnreadCountCache(Long userId, Long meetupId, Long count) {
        Map<Long, Long> userUnreadCounts = unreadCountCache.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        userUnreadCounts.put(meetupId, count);
    }
    
    /**
     * 마지막 읽은 시간 캐시 업데이트
     */
    private void updateLastReadTime(Long userId, Long meetupId, LocalDateTime timestamp) {
        Map<Long, LocalDateTime> userLastReadTimes = lastReadTimeCache.computeIfAbsent(userId, k -> new ConcurrentHashMap<>());
        userLastReadTimes.put(meetupId, timestamp);
    }
    
    /**
     * 사용자의 마지막 읽은 시간 조회
     */
    public LocalDateTime getLastReadTime(Long userId, Long meetupId) {
        Map<Long, LocalDateTime> userLastReadTimes = lastReadTimeCache.get(userId);
        if (userLastReadTimes != null) {
            return userLastReadTimes.get(meetupId);
        }
        return null;
    }
    
    /**
     * 캐시 정리 (1시간마다 실행)
     */
    @Scheduled(fixedRate = 3600000) // 1시간
    public void cleanupCache() {
        try {
            logger.debug("Starting unread message cache cleanup");
            
            // 오래된 캐시 항목 제거 (24시간 이상 된 항목)
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
            
            lastReadTimeCache.entrySet().removeIf(userEntry -> {
                Map<Long, LocalDateTime> meetupTimes = userEntry.getValue();
                meetupTimes.entrySet().removeIf(meetupEntry -> 
                    meetupEntry.getValue().isBefore(cutoffTime));
                return meetupTimes.isEmpty();
            });
            
            logger.debug("Completed unread message cache cleanup");
            
        } catch (Exception e) {
            logger.error("Error during cache cleanup: {}", e.getMessage());
        }
    }
    
    /**
     * 읽지 않은 메시지 수 동기화 (30분마다 실행)
     */
    @Scheduled(fixedRate = 1800000) // 30분
    public void syncUnreadCounts() {
        try {
            logger.debug("Starting unread count synchronization");
            
            // 캐시된 모든 사용자의 읽지 않은 메시지 수를 데이터베이스와 동기화
            for (Map.Entry<Long, Map<Long, Long>> userEntry : unreadCountCache.entrySet()) {
                Long userId = userEntry.getKey();
                Map<Long, Long> meetupCounts = userEntry.getValue();
                
                for (Map.Entry<Long, Long> meetupEntry : meetupCounts.entrySet()) {
                    Long meetupId = meetupEntry.getKey();
                    
                    // 데이터베이스에서 실제 읽지 않은 메시지 수 조회
                    long actualCount = chatMessageRepository.countByMeetupIdAndSenderIdNotAndStatusNot(
                        meetupId, userId, MessageStatus.READ);
                    
                    // 캐시와 실제 값이 다르면 업데이트
                    if (!meetupEntry.getValue().equals(actualCount)) {
                        updateUnreadCountCache(userId, meetupId, actualCount);
                        notificationBroadcastService.broadcastUnreadCountUpdate(userId, meetupId, actualCount);
                        
                        logger.debug("Synced unread count for user {} in meetup {}: {} -> {}", 
                                   userId, meetupId, meetupEntry.getValue(), actualCount);
                    }
                }
            }
            
            logger.debug("Completed unread count synchronization");
            
        } catch (Exception e) {
            logger.error("Error during unread count synchronization: {}", e.getMessage());
        }
    }
    
    /**
     * 읽지 않은 메시지 수 응답 클래스
     */
    public static class UnreadCountResponse {
        private Long userId;
        private Map<Long, Long> unreadCounts;
        private long totalUnread;
        private long timestamp;
        
        public UnreadCountResponse(Long userId, Map<Long, Long> unreadCounts) {
            this.userId = userId;
            this.unreadCounts = unreadCounts;
            this.totalUnread = unreadCounts.values().stream().mapToLong(Long::longValue).sum();
            this.timestamp = System.currentTimeMillis();
        }
        
        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        
        public Map<Long, Long> getUnreadCounts() { return unreadCounts; }
        public void setUnreadCounts(Map<Long, Long> unreadCounts) { this.unreadCounts = unreadCounts; }
        
        public long getTotalUnread() { return totalUnread; }
        public void setTotalUnread(long totalUnread) { this.totalUnread = totalUnread; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    }
}