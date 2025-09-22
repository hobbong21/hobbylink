package com.hobbylink.config;

import com.hobbylink.service.ConnectionManagerService;
import com.hobbylink.service.MessageSyncService;
import com.hobbylink.service.TypingIndicatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.time.LocalDateTime;
import java.util.Map;

@Component
public class WebSocketEventListener {
    
    @Autowired
    private ConnectionManagerService connectionManagerService;
    
    @Autowired
    private TypingIndicatorService typingIndicatorService;
    
    @Autowired
    private MessageSyncService messageSyncService;
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("WebSocket connection established: " + sessionId);
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("WebSocket connection closed: " + sessionId);
        
        // Clean up user session
        connectionManagerService.removeUserSession(sessionId);
    }
    
    @EventListener
    public void handleSubscriptionEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        String destination = headerAccessor.getDestination();
        
        // Extract meetup ID from destination if it's a meetup-specific subscription
        if (destination != null && destination.contains("/topic/meetup/")) {
            try {
                String[] parts = destination.split("/");
                if (parts.length >= 4) {
                    Long meetupId = Long.valueOf(parts[3]);
                    
                    // Get user ID from session attributes
                    Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
                    if (sessionAttributes != null && sessionAttributes.containsKey("userId")) {
                        Long userId = (Long) sessionAttributes.get("userId");
                        
                        // Add user session
                        connectionManagerService.addUserSession(sessionId, userId, meetupId);
                        
                        // 재연결 시 메시지 동기화 (5분 이내 메시지)
                        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
                        messageSyncService.syncMissedMessages(meetupId, userId, fiveMinutesAgo);
                        
                        System.out.println("User " + userId + " subscribed to meetup " + meetupId + 
                                         " with session " + sessionId);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error processing subscription: " + e.getMessage());
            }
        }
    }
    
    @EventListener
    public void handleUnsubscriptionEvent(SessionUnsubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("User unsubscribed with session: " + sessionId);
        
        // Update user activity
        connectionManagerService.updateUserActivity(sessionId);
    }
}