package com.hobbylink.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketChannelInterceptor implements ChannelInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketChannelInterceptor.class);
    
    // 연결 상태 추적을 위한 맵
    private final Map<String, ConnectionInfo> connectionMap = new ConcurrentHashMap<>();
    
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null) {
            String sessionId = accessor.getSessionId();
            StompCommand command = accessor.getCommand();
            
            try {
                switch (command) {
                    case CONNECT:
                        handleConnect(accessor);
                        break;
                    case DISCONNECT:
                        handleDisconnect(accessor);
                        break;
                    case SEND:
                        handleSend(accessor);
                        break;
                    case SUBSCRIBE:
                        handleSubscribe(accessor);
                        break;
                    case UNSUBSCRIBE:
                        handleUnsubscribe(accessor);
                        break;
                    case ERROR:
                        handleError(accessor);
                        break;
                    default:
                        // 다른 명령어들은 로깅만
                        logger.debug("WebSocket command: {} from session: {}", command, sessionId);
                        break;
                }
                
                // 연결 정보 업데이트
                updateConnectionInfo(sessionId);
                
            } catch (Exception e) {
                logger.error("Error processing WebSocket message from session {}: {}", sessionId, e.getMessage(), e);
                // 오류가 발생해도 메시지는 계속 전달
            }
        }
        
        return message;
    }
    
    @Override
    public void postSend(Message<?> message, MessageChannel channel, boolean sent) {
        if (!sent) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor != null) {
                logger.warn("Failed to send WebSocket message from session: {}", accessor.getSessionId());
            }
        }
    }
    
    @Override
    public boolean preReceive(MessageChannel channel) {
        return true;
    }
    
    @Override
    public Message<?> postReceive(Message<?> message, MessageChannel channel) {
        return message;
    }
    
    private void handleConnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        
        // Extract user information from headers during connection
        List<String> userIdHeaders = accessor.getNativeHeader("userId");
        if (userIdHeaders != null && !userIdHeaders.isEmpty()) {
            try {
                Long userId = Long.valueOf(userIdHeaders.get(0));
                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                if (sessionAttributes != null) {
                    sessionAttributes.put("userId", userId);
                    
                    // 연결 정보 저장
                    connectionMap.put(sessionId, new ConnectionInfo(userId, System.currentTimeMillis()));
                    
                    logger.info("User {} connected with session {}", userId, sessionId);
                }
            } catch (NumberFormatException e) {
                logger.error("Invalid userId in WebSocket connection: {}", userIdHeaders.get(0));
                // 잘못된 사용자 ID라도 연결은 허용
            }
        } else {
            logger.warn("WebSocket connection without userId header from session: {}", sessionId);
        }
    }
    
    private void handleDisconnect(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        ConnectionInfo connectionInfo = connectionMap.remove(sessionId);
        
        if (connectionInfo != null) {
            logger.info("User {} disconnected from session {}", connectionInfo.getUserId(), sessionId);
        } else {
            logger.info("Session {} disconnected", sessionId);
        }
    }
    
    private void handleSend(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        String destination = accessor.getDestination();
        
        logger.debug("Message sent to {} from session {}", destination, sessionId);
        
        // 메시지 전송 시 연결 상태 확인
        ConnectionInfo connectionInfo = connectionMap.get(sessionId);
        if (connectionInfo != null) {
            connectionInfo.updateLastActivity();
        }
    }
    
    private void handleSubscribe(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        String destination = accessor.getDestination();
        
        logger.debug("Subscription to {} from session {}", destination, sessionId);
    }
    
    private void handleUnsubscribe(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        String subscriptionId = accessor.getSubscriptionId();
        
        logger.debug("Unsubscription {} from session {}", subscriptionId, sessionId);
    }
    
    private void handleError(StompHeaderAccessor accessor) {
        String sessionId = accessor.getSessionId();
        String errorMessage = accessor.getMessage();
        
        logger.error("WebSocket error from session {}: {}", sessionId, errorMessage);
    }
    
    private void updateConnectionInfo(String sessionId) {
        ConnectionInfo connectionInfo = connectionMap.get(sessionId);
        if (connectionInfo != null) {
            connectionInfo.updateLastActivity();
        }
    }
    
    /**
     * 연결 정보를 저장하는 내부 클래스
     */
    private static class ConnectionInfo {
        private final Long userId;
        private final long connectedAt;
        private volatile long lastActivity;
        
        public ConnectionInfo(Long userId, long connectedAt) {
            this.userId = userId;
            this.connectedAt = connectedAt;
            this.lastActivity = connectedAt;
        }
        
        public Long getUserId() {
            return userId;
        }
        
        public long getConnectedAt() {
            return connectedAt;
        }
        
        public long getLastActivity() {
            return lastActivity;
        }
        
        public void updateLastActivity() {
            this.lastActivity = System.currentTimeMillis();
        }
    }
    
    /**
     * 연결 상태 정보 반환 (모니터링용)
     */
    public Map<String, ConnectionInfo> getConnectionMap() {
        return new ConcurrentHashMap<>(connectionMap);
    }
    
    /**
     * 비활성 연결 정리 (스케줄러에서 사용)
     */
    public void cleanupInactiveConnections(long inactiveThresholdMs) {
        long currentTime = System.currentTimeMillis();
        connectionMap.entrySet().removeIf(entry -> {
            boolean isInactive = (currentTime - entry.getValue().getLastActivity()) > inactiveThresholdMs;
            if (isInactive) {
                logger.info("Cleaning up inactive connection for session: {}", entry.getKey());
            }
            return isInactive;
        });
    }
}