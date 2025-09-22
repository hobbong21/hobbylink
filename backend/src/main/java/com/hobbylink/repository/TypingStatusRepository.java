package com.hobbylink.repository;

import com.hobbylink.model.TypingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 타이핑 상태 Repository
 */
@Repository
public interface TypingStatusRepository extends JpaRepository<TypingStatus, String> {
    
    /**
     * 특정 미팅에서 타이핑 중인 사용자 목록 조회
     * @param meetupId 미팅 ID
     * @return 타이핑 상태 목록
     */
    List<TypingStatus> findByMeetupIdAndIsTypingTrue(Long meetupId);
    
    /**
     * 특정 미팅과 사용자의 타이핑 상태 조회
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     * @return 타이핑 상태
     */
    TypingStatus findByMeetupIdAndUserId(Long meetupId, Long userId);
    
    /**
     * 특정 시간 이전의 타이핑 상태 삭제
     * @param dateTime 기준 시간
     */
    void deleteByLastTypingAtBefore(LocalDateTime dateTime);
    
    /**
     * 특정 사용자의 모든 타이핑 상태 삭제
     * @param userId 사용자 ID
     */
    void deleteByUserId(Long userId);
    
    /**
     * 특정 미팅의 모든 타이핑 상태 삭제
     * @param meetupId 미팅 ID
     */
    void deleteByMeetupId(Long meetupId);
}