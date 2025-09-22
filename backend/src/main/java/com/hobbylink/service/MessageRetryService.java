package com.hobbylink.service;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.MessageStatus;
import com.hobbylink.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 메시지 재시도 메커니즘 서비스
 */
@Service
@Transactional
public class MessageRetryService {
    
    private static final Logger logger = LoggerFactory.getLogger(MessageRetryService.class);
    
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long INITIAL_RETRY_DELAY = 1000; // 1초
    private static final long MAX_RETRY_DELAY = 30000; // 30초
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private MessageStatusService messageStatusService;
    
    // 재시도 중인 메시지 추적
    private final ConcurrentHashMap<String, RetryInfo> retryingMessages = new ConcurrentHashMap<>();
    
    /**
     * 메시지 재시도 시도
     * @param clientMessageId 클라이언트 메시지 ID
     * @param senderId 발신자 ID
     * @param meetupId 미팅 ID
     * @return 재시도 결과
     */
    @Async
    public CompletableFuture<Boolean> retryMessage(String clientMessageId, Long senderId, Long meetupId) {
        String retryKey = clientMessageId + "_" + senderId;
        
        // 이미 재시도 중인 메시지인지 확인
        RetryInfo existingRetry = retryingMessages.get(retryKey);
        if (existingRetry != null && existingRetry.isRetrying()) {
            logger.debug("Message {} is already being retried", clientMessageId);
            return CompletableFuture.completedFuture(false);
        }
        
        // 새로운 재시도 정보 생성
        RetryInfo retryInfo = new RetryInfo(clientMessageId, senderId, meetupId);
        retryingMessages.put(retryKey, retryInfo);
        
        return performRetryWithBackoff(retryInfo);
    }
    
    /**
     * 지수 백오프를 사용한 재시도 수행
     */
    private CompletableFuture<Boolean> performRetryWithBackoff(RetryInfo retryInfo) {
        return CompletableFuture.supplyAsync(() -> {
            while (retryInfo.getAttemptCount() < MAX_RETRY_ATTEMPTS && retryInfo.isRetrying()) {
                try {
                    // 재시도 지연
                    long delay = calculateRetryDelay(retryInfo.getAttemptCount());
                    Thread.sleep(delay);
                    
                    // 메시지 재전송 시도
                    boolean success = attemptMessageResend(retryInfo);
                    
                    if (success) {
                        logger.info("Message {} successfully retried after {} attempts", 
                                   retryInfo.getClientMessageId(), retryInfo.getAttemptCount() + 1);
                        retryInfo.setRetrying(false);
                        retryingMessages.remove(retryInfo.getRetryKey());
                        return true;
                    }
                    
                    retryInfo.incrementAttempt();
                    
                } catch (InterruptedException e) {
                    logger.warn("Message retry interrupted for {}", retryInfo.getClientMessageId());
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    logger.error("Error during message retry for {}: {}", 
                                retryInfo.getClientMessageId(), e.getMessage());
                    retryInfo.incrementAttempt();
                }
            }
            
            // 모든 재시도 실패
            logger.warn("Message {} failed after {} retry attempts", 
                       retryInfo.getClientMessageId(), retryInfo.getAttemptCount());
            
            markMessageAsFailed(retryInfo);
            retryInfo.setRetrying(false);
            retryingMessages.remove(retryInfo.getRetryKey());
            
            return false;
        });
    }
    
    /**
     * 메시지 재전송 시도
     */
    private boolean attemptMessageResend(RetryInfo retryInfo) {
        try {
            // 데이터베이스에서 메시지 조회
            ChatMessage message = chatMessageRepository
                    .findBySenderIdAndClientMessageId(retryInfo.getSenderId(), retryInfo.getClientMessageId())
                    .orElse(null);
            
            if (message == null) {
                logger.error("Message not found for retry: {}", retryInfo.getClientMessageId());
                return false;
            }
            
            // 메시지가 이미 전송됨 상태라면 재시도 불필요
            if (message.getStatus() == MessageStatus.DELIVERED || message.getStatus() == MessageStatus.READ) {
                logger.debug("Message {} already delivered, skipping retry", retryInfo.getClientMessageId());
                return true;
            }
            
            // WebSocket을 통해 메시지 재전송
            messagingTemplate.convertAndSend(
                "/topic/meetup/" + retryInfo.getMeetupId() + "/messages",
                message
            );
            
            // 상태를 전송 중으로 업데이트
            message.setStatus(MessageStatus.SENDING);
            chatMessageRepository.save(message);
            
            logger.debug("Message {} resent, attempt {}", 
                        retryInfo.getClientMessageId(), retryInfo.getAttemptCount() + 1);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to resend message {}: {}", 
                        retryInfo.getClientMessageId(), e.getMessage());
            return false;
        }
    }
    
    /**
     * 재시도 지연 시간 계산 (지수 백오프)
     */
    private long calculateRetryDelay(int attemptCount) {
        long delay = INITIAL_RETRY_DELAY * (long) Math.pow(2, attemptCount);
        return Math.min(delay, MAX_RETRY_DELAY);
    }
    
    /**
     * 메시지를 실패 상태로 표시
     */
    private void markMessageAsFailed(RetryInfo retryInfo) {
        try {
            messageStatusService.updateMessageStatusByClientId(
                retryInfo.getSenderId(),
                retryInfo.getClientMessageId(),
                MessageStatus.FAILED
            );
            
            // 클라이언트에게 실패 알림 전송
            MessageFailureNotification notification = new MessageFailureNotification(
                retryInfo.getClientMessageId(),
                "메시지 전송에 실패했습니다. 네트워크 연결을 확인해주세요.",
                System.currentTimeMillis()
            );
            
            messagingTemplate.convertAndSendToUser(
                retryInfo.getSenderId().toString(),
                "/queue/message-failures",
                notification
            );
            
        } catch (Exception e) {
            logger.error("Failed to mark message as failed: {}", e.getMessage());
        }
    }
    
    /**
     * 재시도 취소
     */
    public void cancelRetry(String clientMessageId, Long senderId) {
        String retryKey = clientMessageId + "_" + senderId;
        RetryInfo retryInfo = retryingMessages.get(retryKey);
        
        if (retryInfo != null) {
            retryInfo.setRetrying(false);
            retryingMessages.remove(retryKey);
            logger.info("Retry cancelled for message: {}", clientMessageId);
        }
    }
    
    /**
     * 오래된 재시도 정보 정리 (5분마다 실행)
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupOldRetries() {
        long currentTime = System.currentTimeMillis();
        long maxAge = 10 * 60 * 1000; // 10분
        
        retryingMessages.entrySet().removeIf(entry -> {
            RetryInfo retryInfo = entry.getValue();
            boolean isOld = (currentTime - retryInfo.getStartTime()) > maxAge;
            
            if (isOld) {
                logger.info("Cleaning up old retry info for message: {}", retryInfo.getClientMessageId());
                retryInfo.setRetrying(false);
            }
            
            return isOld;
        });
    }
    
    /**
     * 실패한 메시지 자동 재시도 (1분마다 실행)
     */
    @Scheduled(fixedRate = 60000)
    public void autoRetryFailedMessages() {
        try {
            // 5분 이내에 전송 상태인 메시지들을 조회
            LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
            
            List<ChatMessage> stuckMessages = chatMessageRepository
                    .findBySentAtAfterAndStatus(fiveMinutesAgo, MessageStatus.SENDING);
            
            for (ChatMessage message : stuckMessages) {
                if (message.getClientMessageId() != null) {
                    String retryKey = message.getClientMessageId() + "_" + message.getSenderId();
                    
                    // 이미 재시도 중이 아닌 경우에만 재시도
                    if (!retryingMessages.containsKey(retryKey)) {
                        logger.info("Auto-retrying stuck message: {}", message.getClientMessageId());
                        retryMessage(message.getClientMessageId(), message.getSenderId(), message.getMeetupId());
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("Error during auto-retry of failed messages: {}", e.getMessage());
        }
    }
    
    /**
     * 재시도 정보 클래스
     */
    private static class RetryInfo {
        private final String clientMessageId;
        private final Long senderId;
        private final Long meetupId;
        private final long startTime;
        private final AtomicInteger attemptCount;
        private volatile boolean retrying;
        
        public RetryInfo(String clientMessageId, Long senderId, Long meetupId) {
            this.clientMessageId = clientMessageId;
            this.senderId = senderId;
            this.meetupId = meetupId;
            this.startTime = System.currentTimeMillis();
            this.attemptCount = new AtomicInteger(0);
            this.retrying = true;
        }
        
        public String getClientMessageId() {
            return clientMessageId;
        }
        
        public Long getSenderId() {
            return senderId;
        }
        
        public Long getMeetupId() {
            return meetupId;
        }
        
        public long getStartTime() {
            return startTime;
        }
        
        public int getAttemptCount() {
            return attemptCount.get();
        }
        
        public void incrementAttempt() {
            attemptCount.incrementAndGet();
        }
        
        public boolean isRetrying() {
            return retrying;
        }
        
        public void setRetrying(boolean retrying) {
            this.retrying = retrying;
        }
        
        public String getRetryKey() {
            return clientMessageId + "_" + senderId;
        }
    }
    
    /**
     * 메시지 실패 알림 클래스
     */
    public static class MessageFailureNotification {
        private String clientMessageId;
        private String message;
        private long timestamp;
        
        public MessageFailureNotification(String clientMessageId, String message, long timestamp) {
            this.clientMessageId = clientMessageId;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public String getClientMessageId() {
            return clientMessageId;
        }
        
        public void setClientMessageId(String clientMessageId) {
            this.clientMessageId = clientMessageId;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
        
        public long getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
    }
}