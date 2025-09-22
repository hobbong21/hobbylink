package com.hobbylink.service;

import com.hobbylink.config.WebSocketChannelInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * WebSocket 연결 모니터링 서비스
 */
@Service
public class WebSocketMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketMonitoringService.class);
    
    @Autowired
    private WebSocketChannelInterceptor webSocketChannelInterceptor;
    
    @Autowired
    private ConnectionManagerService connectionManagerService;
    
    @Autowired
    private TypingIndicatorService typingIndicatorService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    /**
     * 비활성 연결 정리 (5분마다 실행)
     */
    @Scheduled(fixedRate = 300000) // 5분
    public void cleanupInactiveConnections() {
        try {
            logger.debug("Starting cleanup of inactive connections");
            
            // 30분 이상 비활성 연결 정리
            long inactiveThreshold = 30 * 60 * 1000; // 30분
            webSocketChannelInterceptor.cleanupInactiveConnections(inactiveThreshold);
            
            // 사용자 세션 정리
            connectionManagerService.cleanupInactiveSessions();
            
            // 오래된 타이핑 상태 정리
            typingIndicatorService.cleanupOldTypingStatuses();
            
            logger.debug("Completed cleanup of inactive connections");
            
        } catch (Exception e) {
            logger.error("Error during connection cleanup: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 연결 상태 모니터링 (1분마다 실행)
     */
    @Scheduled(fixedRate = 60000) // 1분
    public void monitorConnections() {
        try {
            int activeConnections = webSocketChannelInterceptor.getConnectionMap().size();
            logger.debug("Active WebSocket connections: {}", activeConnections);
            
            // 연결 수가 많을 때 경고
            if (activeConnections > 1000) {
                logger.warn("High number of active WebSocket connections: {}", activeConnections);
            }
            
        } catch (Exception e) {
            logger.error("Error during connection monitoring: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 하트비트 메시지 전송 (30초마다 실행)
     */
    @Scheduled(fixedRate = 30000) // 30초
    public void sendHeartbeat() {
        try {
            // 모든 활성 연결에 하트비트 전송
            HeartbeatMessage heartbeat = new HeartbeatMessage(System.currentTimeMillis());
            messagingTemplate.convertAndSend("/topic/heartbeat", heartbeat);
            
        } catch (Exception e) {
            logger.error("Error sending heartbeat: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 연결 상태 브로드캐스트 (2분마다 실행)
     */
    @Scheduled(fixedRate = 120000) // 2분
    public void broadcastConnectionStatus() {
        try {
            ConnectionStatusMessage status = new ConnectionStatusMessage(
                "HEALTHY",
                "WebSocket 연결이 정상적으로 작동 중입니다.",
                System.currentTimeMillis()
            );
            
            messagingTemplate.convertAndSend("/topic/connection-status", status);
            
        } catch (Exception e) {
            logger.error("Error broadcasting connection status: {}", e.getMessage(), e);
            
            // 오류 발생 시 오류 상태 브로드캐스트
            try {
                ConnectionStatusMessage errorStatus = new ConnectionStatusMessage(
                    "ERROR",
                    "WebSocket 연결에 문제가 발생했습니다: " + e.getMessage(),
                    System.currentTimeMillis()
                );
                
                messagingTemplate.convertAndSend("/topic/connection-status", errorStatus);
            } catch (Exception broadcastError) {
                logger.error("Failed to broadcast error status: {}", broadcastError.getMessage());
            }
        }
    }
    
    /**
     * 하트비트 메시지 클래스
     */
    public static class HeartbeatMessage {
        private long timestamp;
        private String type = "HEARTBEAT";
        
        public HeartbeatMessage(long timestamp) {
            this.timestamp = timestamp;
        }
        
        public long getTimestamp() {
            return timestamp;
        }
        
        public void setTimestamp(long timestamp) {
            this.timestamp = timestamp;
        }
        
        public String getType() {
            return type;
        }
        
        public void setType(String type) {
            this.type = type;
        }
    }
    
    /**
     * 연결 상태 메시지 클래스
     */
    public static class ConnectionStatusMessage {
        private String status;
        private String message;
        private long timestamp;
        
        public ConnectionStatusMessage(String status, String message, long timestamp) {
            this.status = status;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
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