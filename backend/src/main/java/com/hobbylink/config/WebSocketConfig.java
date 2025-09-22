package com.hobbylink.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

/**
 * WebSocket 설정
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Autowired
    private WebSocketChannelInterceptor webSocketChannelInterceptor;
    
    @Bean
    public WebSocketErrorHandler webSocketErrorHandler(SimpMessagingTemplate messagingTemplate) {
        return new WebSocketErrorHandler(messagingTemplate);
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지 브로커 설정
        config.enableSimpleBroker("/topic", "/queue")
              .setHeartbeatValue(new long[]{10000, 10000}); // 10초 간격 하트비트
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // STOMP 엔드포인트 등록
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000")
                .withSockJS()
                .setHeartbeatTime(25000) // 25초 하트비트
                .setDisconnectDelay(5000) // 5초 연결 해제 지연
                .setStreamBytesLimit(128 * 1024) // 128KB 스트림 제한
                .setHttpMessageCacheSize(1000) // HTTP 메시지 캐시 크기
                .setSessionCookieNeeded(false); // 세션 쿠키 불필요
    }
    
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
        // WebSocket 전송 설정
        registry.setMessageSizeLimit(64 * 1024) // 64KB 메시지 크기 제한
                .setSendBufferSizeLimit(512 * 1024) // 512KB 전송 버퍼 제한
                .setSendTimeLimit(20 * 1000) // 20초 전송 시간 제한
                .setTimeToFirstMessage(30 * 1000); // 첫 메시지까지 30초 제한
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // 클라이언트 인바운드 채널 설정
        registration.interceptors(webSocketChannelInterceptor)
                   .taskExecutor()
                   .corePoolSize(4)
                   .maxPoolSize(8)
                   .queueCapacity(1000);
    }
    
    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        // 클라이언트 아웃바운드 채널 설정
        registration.taskExecutor()
                   .corePoolSize(4)
                   .maxPoolSize(8)
                   .queueCapacity(1000);
    }
}