package com.hobbylink.service;

import com.hobbylink.model.User;
import com.hobbylink.model.UserSession;
import com.hobbylink.model.UserStatus;
import com.hobbylink.repository.UserRepository;
import com.hobbylink.repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 사용자 연결 관리 서비스
 */
@Service
@Transactional
public class ConnectionManagerService {
    
    @Autowired
    private UserSessionRepository userSessionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // 메모리 내 활성 세션 캐시
    private final Map<String, UserSession> activeSessions = new ConcurrentHashMap<>();
    
    /**
     * 사용자 세션 추가
     * @param sessionId 세션 ID
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     */
    public void addUserSession(String sessionId, Long userId, Long meetupId) {
        // 기존 세션이 있다면 제거
        removeUserSession(sessionId);
        
        UserSession session = new UserSession(sessionId, userId, meetupId);
        userSessionRepository.save(session);
        activeSessions.put(sessionId, session);
    }
    
    /**
     * 사용자 세션 제거
     * @param sessionId 세션 ID
     */
    public void removeUserSession(String sessionId) {
        activeSessions.remove(sessionId);
        userSessionRepository.deleteById(sessionId);
    }
    
    /**
     * 특정 미팅의 온라인 사용자 목록 반환
     * @param meetupId 미팅 ID
     * @return 온라인 사용자 목록
     */
    public List<User> getOnlineUsers(Long meetupId) {
        // 최근 5분 이내에 활동한 세션만 온라인으로 간주
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        
        List<UserSession> activeSessions = userSessionRepository
                .findByMeetupIdAndStatusAndLastActivityAfter(meetupId, UserStatus.ONLINE, fiveMinutesAgo);
        
        return activeSessions.stream()
                .map(session -> userRepository.findById(session.getUserId()).orElse(null))
                .filter(user -> user != null)
                .distinct()
                .collect(Collectors.toList());
    }
    
    /**
     * 사용자 활동 시간 업데이트
     * @param sessionId 세션 ID
     */
    public void updateUserActivity(String sessionId) {
        UserSession session = activeSessions.get(sessionId);
        if (session != null) {
            session.updateActivity();
            userSessionRepository.save(session);
        } else {
            // 캐시에 없으면 데이터베이스에서 조회
            userSessionRepository.findById(sessionId).ifPresent(dbSession -> {
                dbSession.updateActivity();
                userSessionRepository.save(dbSession);
                activeSessions.put(sessionId, dbSession);
            });
        }
    }
    
    /**
     * 사용자 상태 변경
     * @param sessionId 세션 ID
     * @param status 새로운 상태
     */
    public void updateUserStatus(String sessionId, UserStatus status) {
        UserSession session = activeSessions.get(sessionId);
        if (session != null) {
            session.setStatus(status);
            session.updateActivity();
            userSessionRepository.save(session);
        }
    }
    
    /**
     * 온라인 사용자 응답 생성
     * @param meetupId 미팅 ID
     * @return 온라인 사용자 응답
     */
    public OnlineUsersResponse getOnlineUsersResponse(Long meetupId) {
        List<User> onlineUsers = getOnlineUsers(meetupId);
        return new OnlineUsersResponse(meetupId, onlineUsers, onlineUsers.size());
    }
    
    /**
     * 비활성 세션 정리 (스케줄러에서 사용)
     */
    public void cleanupInactiveSessions() {
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
        
        // 30분 이상 비활성 세션 제거
        List<UserSession> inactiveSessions = userSessionRepository
                .findByLastActivityBefore(thirtyMinutesAgo);
        
        for (UserSession session : inactiveSessions) {
            activeSessions.remove(session.getSessionId());
            userSessionRepository.delete(session);
        }
    }
    
    /**
     * 특정 사용자의 모든 세션 제거
     * @param userId 사용자 ID
     */
    public void removeAllUserSessions(Long userId) {
        List<UserSession> userSessions = userSessionRepository.findByUserId(userId);
        
        for (UserSession session : userSessions) {
            activeSessions.remove(session.getSessionId());
            userSessionRepository.delete(session);
        }
    }
    
    /**
     * 온라인 사용자 응답 클래스
     */
    public static class OnlineUsersResponse {
        private Long meetupId;
        private List<User> onlineUsers;
        private int count;
        
        public OnlineUsersResponse(Long meetupId, List<User> onlineUsers, int count) {
            this.meetupId = meetupId;
            this.onlineUsers = onlineUsers;
            this.count = count;
        }
        
        // Getters and Setters
        public Long getMeetupId() {
            return meetupId;
        }
        
        public void setMeetupId(Long meetupId) {
            this.meetupId = meetupId;
        }
        
        public List<User> getOnlineUsers() {
            return onlineUsers;
        }
        
        public void setOnlineUsers(List<User> onlineUsers) {
            this.onlineUsers = onlineUsers;
        }
        
        public int getCount() {
            return count;
        }
        
        public void setCount(int count) {
            this.count = count;
        }
    }
}