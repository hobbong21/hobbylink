package com.hobbylink.repository;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 채팅 메시지 Repository
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    /**
     * 특정 미팅의 메시지를 시간순으로 조회
     * @param meetupId 미팅 ID
     * @param pageable 페이지 정보
     * @return 메시지 페이지
     */
    Page<ChatMessage> findByMeetupIdOrderBySentAtDesc(Long meetupId, Pageable pageable);
    
    /**
     * 특정 미팅의 최근 메시지 조회
     * @param meetupId 미팅 ID
     * @return 메시지 목록
     */
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.meetupId = :meetupId ORDER BY cm.sentAt ASC")
    List<ChatMessage> findByMeetupIdOrderBySentAtAsc(@Param("meetupId") Long meetupId);
    
    /**
     * 클라이언트 메시지 ID로 메시지 조회
     * @param senderId 발신자 ID
     * @param clientMessageId 클라이언트 메시지 ID
     * @return 메시지
     */
    Optional<ChatMessage> findBySenderIdAndClientMessageId(Long senderId, String clientMessageId);
    
    /**
     * 특정 미팅에서 특정 사용자가 보내지 않은 메시지 중 특정 상태가 아닌 메시지 조회
     * @param meetupId 미팅 ID
     * @param senderId 발신자 ID (제외할)
     * @param status 상태 (제외할)
     * @return 메시지 목록
     */
    List<ChatMessage> findByMeetupIdAndSenderIdNotAndStatusNot(Long meetupId, Long senderId, MessageStatus status);
    
    /**
     * 특정 미팅에서 특정 사용자가 보내지 않은 메시지 중 특정 상태가 아닌 메시지 수 조회
     * @param meetupId 미팅 ID
     * @param senderId 발신자 ID (제외할)
     * @param status 상태 (제외할)
     * @return 메시지 수
     */
    long countByMeetupIdAndSenderIdNotAndStatusNot(Long meetupId, Long senderId, MessageStatus status);
    
    /**
     * 특정 메시지 ID 목록과 미팅 ID, 발신자 제외 조건으로 메시지 조회
     * @param messageIds 메시지 ID 목록
     * @param meetupId 미팅 ID
     * @param senderId 발신자 ID (제외할)
     * @return 메시지 목록
     */
    List<ChatMessage> findByIdInAndMeetupIdAndSenderIdNot(List<Long> messageIds, Long meetupId, Long senderId);
    
    /**
     * 특정 시간 이전의 메시지 삭제 (정리용)
     * @param dateTime 기준 시간
     */
    void deleteBySentAtBefore(LocalDateTime dateTime);
    
    /**
     * 특정 미팅의 메시지 수 조회
     * @param meetupId 미팅 ID
     * @return 메시지 수
     */
    long countByMeetupId(Long meetupId);
    
    /**
     * 특정 사용자가 보낸 메시지 수 조회
     * @param senderId 발신자 ID
     * @return 메시지 수
     */
    long countBySenderId(Long senderId);
    
    /**
     * 특정 시간 이후에 전송된 특정 상태의 메시지 조회
     * @param sentAt 기준 시간
     * @param status 메시지 상태
     * @return 메시지 목록
     */
    List<ChatMessage> findBySentAtAfterAndStatus(LocalDateTime sentAt, MessageStatus status);
    
    /**
     * 특정 미팅의 특정 시간 이후 메시지를 시간순으로 조회
     * @param meetupId 미팅 ID
     * @param sentAt 기준 시간
     * @return 메시지 목록
     */
    List<ChatMessage> findByMeetupIdAndSentAtAfterOrderBySentAtAsc(Long meetupId, LocalDateTime sentAt);
    
    /**
     * 특정 미팅의 특정 시간 범위 메시지를 시간순으로 조회
     * @param meetupId 미팅 ID
     * @param startTime 시작 시간
     * @param endTime 종료 시간
     * @return 메시지 목록
     */
    List<ChatMessage> findByMeetupIdAndSentAtBetweenOrderBySentAtAsc(Long meetupId, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * 특정 미팅에서 특정 사용자가 보내지 않은 모든 메시지를 읽음으로 표시
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID (자신이 보낸 메시지는 제외)
     * @return 업데이트된 메시지 수
     */
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage cm SET cm.status = 'READ', cm.readAt = CURRENT_TIMESTAMP " +
           "WHERE cm.meetupId = :meetupId AND cm.senderId != :userId AND cm.status != 'read'")
    int markAllMessagesAsReadForUser(@Param("meetupId") Long meetupId, @Param("userId") Long userId);
}