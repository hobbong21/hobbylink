package com.hobbylink.service;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.MessageStatus;
import com.hobbylink.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 메시지 상태 관리 서비스
 */
@Service
@Transactional
public class MessageStatusService {
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    /**
     * 메시지를 전송됨 상태로 표시
     * @param messageId 메시지 ID
     * @return 업데이트된 메시지
     */
    public Optional<ChatMessage> markAsDelivered(Long messageId) {
        return chatMessageRepository.findById(messageId).map(message -> {
            if (message.getStatus() == MessageStatus.SENDING) {
                message.markAsDelivered();
                return chatMessageRepository.save(message);
            }
            return message;
        });
    }
    
    /**
     * 메시지를 읽음 상태로 표시
     * @param messageId 메시지 ID
     * @return 업데이트된 메시지
     */
    public Optional<ChatMessage> markAsRead(Long messageId) {
        return chatMessageRepository.findById(messageId).map(message -> {
            if (message.getStatus() != MessageStatus.READ) {
                message.markAsRead();
                return chatMessageRepository.save(message);
            }
            return message;
        });
    }
    
    /**
     * 메시지를 실패 상태로 표시
     * @param messageId 메시지 ID
     * @return 업데이트된 메시지
     */
    public Optional<ChatMessage> markAsFailed(Long messageId) {
        return chatMessageRepository.findById(messageId).map(message -> {
            message.markAsFailed();
            return chatMessageRepository.save(message);
        });
    }
    
    /**
     * 여러 메시지를 읽음 상태로 표시
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID
     * @param messageIds 메시지 ID 목록
     * @return 업데이트된 메시지 수
     */
    public int markMessagesAsRead(Long meetupId, Long userId, List<Long> messageIds) {
        List<ChatMessage> messages = chatMessageRepository.findByIdInAndMeetupIdAndSenderIdNot(
                messageIds, meetupId, userId);
        
        int updatedCount = 0;
        for (ChatMessage message : messages) {
            if (message.getStatus() != MessageStatus.READ) {
                message.markAsRead();
                chatMessageRepository.save(message);
                updatedCount++;
            }
        }
        
        return updatedCount;
    }
    
    /**
     * 특정 미팅의 읽지 않은 메시지를 모두 읽음 상태로 표시
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID (자신이 보낸 메시지는 제외)
     * @return 업데이트된 메시지 수
     */
    public int markAllMessagesAsRead(Long meetupId, Long userId) {
        List<ChatMessage> unreadMessages = chatMessageRepository
                .findByMeetupIdAndSenderIdNotAndStatusNot(meetupId, userId, MessageStatus.READ);
        
        int updatedCount = 0;
        for (ChatMessage message : unreadMessages) {
            message.markAsRead();
            chatMessageRepository.save(message);
            updatedCount++;
        }
        
        return updatedCount;
    }
    
    /**
     * 특정 사용자가 보낸 메시지의 상태 업데이트
     * @param senderId 발신자 ID
     * @param clientMessageId 클라이언트 메시지 ID
     * @param status 새로운 상태
     * @return 업데이트된 메시지
     */
    public Optional<ChatMessage> updateMessageStatusByClientId(Long senderId, String clientMessageId, MessageStatus status) {
        return chatMessageRepository.findBySenderIdAndClientMessageId(senderId, clientMessageId)
                .map(message -> {
                    message.setStatus(status);
                    if (status == MessageStatus.DELIVERED && message.getDeliveredAt() == null) {
                        message.setDeliveredAt(LocalDateTime.now());
                    } else if (status == MessageStatus.READ && message.getReadAt() == null) {
                        message.setReadAt(LocalDateTime.now());
                        if (message.getDeliveredAt() == null) {
                            message.setDeliveredAt(LocalDateTime.now());
                        }
                    }
                    return chatMessageRepository.save(message);
                });
    }
    
    /**
     * 특정 미팅의 읽지 않은 메시지 수 반환
     * @param meetupId 미팅 ID
     * @param userId 사용자 ID (자신이 보낸 메시지는 제외)
     * @return 읽지 않은 메시지 수
     */
    public long getUnreadMessageCount(Long meetupId, Long userId) {
        return chatMessageRepository.countByMeetupIdAndSenderIdNotAndStatusNot(
                meetupId, userId, MessageStatus.READ);
    }
}