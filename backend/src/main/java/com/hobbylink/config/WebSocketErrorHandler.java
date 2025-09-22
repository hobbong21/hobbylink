package com.hobbylink.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

import java.security.Principal;

/**
 * WebSocket 오류 처리기
 */
@Controller
public class WebSocketErrorHandler extends StompSubProtocolErrorHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketErrorHandler.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    
    public WebSocketErrorHandler(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(clientMessage, StompHeaderAccessor.class);
        
        if (accessor != null) {
            String sessionId = accessor.getSessionId();
            String destination = accessor.getDestination();
            
            logger.error("Error processing client message from session {} to destination {}: {}", 
                        sessionId, destination, ex.getMessage(), ex);
            
            // 클라이언트에게 오류 메시지 전송
            try {
                ErrorResponse errorResponse = new ErrorResponse(
                    "MESSAGE_PROCESSING_ERROR",
                    "메시지 처리 중 오류가 발생했습니다: " + ex.getMessage(),
                    System.currentTimeMillis()
                );
                // 세션 기준이 아닌 userId 기반 경로로 전달 (클라이언트 구독과 일치)
                messagingTemplate.convertAndSend(
                    "/user/" + sessionId + "/queue/errors",
                    errorResponse
                );
            } catch (Exception e) {
                logger.error("Failed to send error message to client: {}", e.getMessage());
            }
        }
        
        return super.handleClientMessageProcessingError(clientMessage, ex);
    }
    
    @Override
    public Message<byte[]> handleErrorMessageToClient(Message<byte[]> errorMessage) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(errorMessage, StompHeaderAccessor.class);
        
        if (accessor != null) {
            String sessionId = accessor.getSessionId();
            logger.error("Sending error message to client session {}: {}", sessionId, new String(errorMessage.getPayload()));
        }
        
        return super.handleErrorMessageToClient(errorMessage);
    }
    
    /**
     * 메시지 전송 실패 처리
     */
    @MessageExceptionHandler(MessageDeliveryException.class)
    @SendToUser("/queue/errors")
    public ErrorResponse handleMessageDeliveryException(MessageDeliveryException ex, Principal principal) {
        logger.error("Message delivery failed for user {}: {}", 
                    principal != null ? principal.getName() : "unknown", ex.getMessage(), ex);
        
        return new ErrorResponse(
            "MESSAGE_DELIVERY_FAILED",
            "메시지 전송에 실패했습니다. 연결 상태를 확인해주세요.",
            System.currentTimeMillis()
        );
    }
    
    /**
     * 일반적인 런타임 예외 처리
     */
    @MessageExceptionHandler(RuntimeException.class)
    @SendToUser("/queue/errors")
    public ErrorResponse handleRuntimeException(RuntimeException ex, Principal principal) {
        logger.error("Runtime exception for user {}: {}", 
                    principal != null ? principal.getName() : "unknown", ex.getMessage(), ex);
        
        return new ErrorResponse(
            "RUNTIME_ERROR",
            "처리 중 오류가 발생했습니다: " + ex.getMessage(),
            System.currentTimeMillis()
        );
    }
    
    /**
     * 모든 예외에 대한 기본 처리
     */
    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public ErrorResponse handleGenericException(Exception ex, Principal principal) {
        logger.error("Unexpected exception for user {}: {}", 
                    principal != null ? principal.getName() : "unknown", ex.getMessage(), ex);
        
        return new ErrorResponse(
            "UNEXPECTED_ERROR",
            "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            System.currentTimeMillis()
        );
    }
    
    /**
     * 오류 응답 클래스
     */
    public static class ErrorResponse {
        private String errorCode;
        private String message;
        private long timestamp;
        
        public ErrorResponse(String errorCode, String message, long timestamp) {
            this.errorCode = errorCode;
            this.message = message;
            this.timestamp = timestamp;
        }
        
        // Getters and Setters
        public String getErrorCode() {
            return errorCode;
        }
        
        public void setErrorCode(String errorCode) {
            this.errorCode = errorCode;
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