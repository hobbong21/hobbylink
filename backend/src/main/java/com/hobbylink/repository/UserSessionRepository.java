package com.hobbylink.repository;

import com.hobbylink.model.UserSession;
import com.hobbylink.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 사용자 세션 Repository
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    
    /**
     * 특정 미팅의 특정 상태인 사용자 세션 중 특정 시간 이후 활동한 세션 조회
     * @param meetupId 미팅 ID
     * @param status 사용자 상태
     * @param lastActivity 마지막 활동 시간
     * @return 사용자 세션 목록
     */
    List<UserSession> findByMeetupIdAndStatusAndLastActivityAfter(Long meetupId, UserStatus status, LocalDateTime lastActivity);
    
    /**
     * 특정 사용자의 모든 세션 조회
     * @param userId 사용자 ID
     * @return 사용자 세션 목록
     */
    List<UserSession> findByUserId(Long userId);
    
    /**
     * 특정 미팅의 모든 세션 조회
     * @param meetupId 미팅 ID
     * @return 사용자 세션 목록
     */
    List<UserSession> findByMeetupId(Long meetupId);
    
    /**
     * 특정 시간 이전에 활동한 세션 조회 (비활성 세션)
     * @param lastActivity 마지막 활동 시간
     * @return 사용자 세션 목록
     */
    List<UserSession> findByLastActivityBefore(LocalDateTime lastActivity);
    
    /**
     * 특정 사용자와 미팅의 세션 조회
     * @param userId 사용자 ID
     * @param meetupId 미팅 ID
     * @return 사용자 세션 목록
     */
    List<UserSession> findByUserIdAndMeetupId(Long userId, Long meetupId);
    
    /**
     * 특정 상태의 세션 수 조회
     * @param status 사용자 상태
     * @return 세션 수
     */
    long countByStatus(UserStatus status);
    
    /**
     * 특정 미팅의 온라인 사용자 수 조회
     * @param meetupId 미팅 ID
     * @param status 사용자 상태
     * @param lastActivity 마지막 활동 시간
     * @return 온라인 사용자 수
     */
    long countByMeetupIdAndStatusAndLastActivityAfter(Long meetupId, UserStatus status, LocalDateTime lastActivity);
}