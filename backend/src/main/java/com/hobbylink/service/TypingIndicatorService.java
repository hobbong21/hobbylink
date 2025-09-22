package com.hobbylink.service;

import com.hobbylink.model.TypingStatus;
import com.hobbylink.model.User;
import com.hobbylink.repository.TypingStatusRepository;
import com.hobbylink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 타이핑 표시기 서비스
 */
@Service
@Transactional
public class TypingIndicatorService {
    
    @Autowired
    private TypingStatusRepository typingStatusRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 사용자가 타이핑을 시작했음을 표시
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     */
    public void startTyping(Long meetupId, Long userId) {
        String id = meetupId + "_" + userId;
        
        TypingStatus typingStatus = typingStatusRepository.findById(id)
                .orElse(new TypingStatus(meetupId, userId));
        
        typingStatus.setTyping(true);
        typingStatus.setLastTypingAt(LocalDateTime.now());
        
        typingStatusRepository.save(typingStatus);
    }
    
    /**
     * 사용자가 타이핑을 중지했음을 표시
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     */
    public void stopTyping(Long meetupId, Long userId) {
        String id = meetupId + "_" + userId;
        
        typingStatusRepository.findById(id).ifPresent(typingStatus -> {
            typingStatus.setTyping(false);
            typingStatus.setLastTypingAt(LocalDateTime.now());
            typingStatusRepository.save(typingStatus);
        });
    }
    
    /**
     * 특정 미팅에서 타이핑 중인 사용자 목록 반환
     * @param meetupId 미팅 ID
     * @return 타이핑 중인 사용자 목록
     */
    public List<User> getTypingUsers(Long meetupId) {
        List<TypingStatus> typingStatuses = typingStatusRepository.findByMeetupIdAndIsTypingTrue(meetupId);
        
        // 5분 이상 된 타이핑 상태는 제거
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        
        return typingStatuses.stream()
                .filter(status -> status.getLastTypingAt().isAfter(fiveMinutesAgo))
                .map(status -> userRepository.findById(status.getUserId()).orElse(null))
                .filter(user -> user != null)
                .collect(Collectors.toList());
    }
    
    /**
     * 타이핑 표시기 응답 생성
     * @param meetupId 미팅 ID
     * @return 타이핑 표시기 응답
     */
    public TypingIndicatorResponse getTypingIndicatorResponse(Long meetupId) {
        List<User> typingUsers = getTypingUsers(meetupId);
        
        String message = "";
        if (typingUsers.size() == 1) {
            message = typingUsers.get(0).getUsername() + "님이 입력 중...";
        } else if (typingUsers.size() > 1) {
            message = typingUsers.size() + "명이 입력 중...";
        }
        
        return new TypingIndicatorResponse(meetupId, typingUsers, message);
    }
    
    /**
     * 사용자의 모든 타이핑 상태 정리
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     */
    public void cleanupUserTypingStatus(Long meetupId, Long userId) {
        String id = meetupId + "_" + userId;
        typingStatusRepository.deleteById(id);
    }
    
    /**
     * 오래된 타이핑 상태 정리 (스케줄러에서 사용)
     */
    public void cleanupOldTypingStatuses() {
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        typingStatusRepository.deleteByLastTypingAtBefore(tenMinutesAgo);
    }
    
    /**
     * 타이핑 표시기 응답 클래스
     */
    public static class TypingIndicatorResponse {
        private Long meetupId;
        private List<User> typingUsers;
        private String message;
        
        public TypingIndicatorResponse(Long meetupId, List<User> typingUsers, String message) {
            this.meetupId = meetupId;
            this.typingUsers = typingUsers;
            this.message = message;
        }
        
        // Getters and Setters
        public Long getMeetupId() {
            return meetupId;
        }
        
        public void setMeetupId(Long meetupId) {
            this.meetupId = meetupId;
        }
        
        public List<User> getTypingUsers() {
            return typingUsers;
        }
        
        public void setTypingUsers(List<User> typingUsers) {
            this.typingUsers = typingUsers;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}