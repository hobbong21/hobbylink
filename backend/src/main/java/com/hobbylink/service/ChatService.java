package com.hobbylink.service;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.Meetup;
import com.hobbylink.model.User;
import com.hobbylink.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 채팅 서비스
 */
@Service
@Transactional
public class ChatService {
    
    @Autowired
    private ChatMessageRepository chatMessageRepository;
    
    @Autowired
    private MessageFormattingService messageFormattingService;
    
    /**
     * 메시지 전송
     * @param content 메시지 내용
     * @param meetup 미팅
     * @param sender 발신자
     * @return 저장된 메시지
     */
    public ChatMessage sendMessage(String content, Meetup meetup, User sender) {
        // 메시지 유효성 검사
        MessageFormattingService.ValidationResult validation = messageFormattingService.validateMessage(content);
        if (!validation.isValid()) {
            throw new IllegalArgumentException(validation.getMessage());
        }
        
        // 메시지 정화
        String sanitizedContent = messageFormattingService.sanitizeMessage(content);
        
        // 메시지 포맷팅
        String formattedContent = messageFormattingService.formatMessage(sanitizedContent);
        
        ChatMessage message = new ChatMessage(sanitizedContent, meetup, sender);
        message.setFormattedContent(formattedContent);
        
        return chatMessageRepository.save(message);
    }
    
    /**
     * 메시지 업데이트
     * @param message 메시지
     * @return 업데이트된 메시지
     */
    public ChatMessage updateMessage(ChatMessage message) {
        return chatMessageRepository.save(message);
    }
    
    /**
     * 특정 미팅의 메시지 목록 조회
     * @param meetupId 미팅 ID
     * @return 메시지 목록
     */
    public List<ChatMessage> getMessagesByMeetupId(Long meetupId) {
        return chatMessageRepository.findByMeetupIdOrderBySentAtAsc(meetupId);
    }
    
    /**
     * 특정 미팅의 메시지 페이지 조회
     * @param meetupId 미팅 ID
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @return 메시지 페이지
     */
    public Page<ChatMessage> getMessagesByMeetupId(Long meetupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findByMeetupIdOrderBySentAtDesc(meetupId, pageable);
    }
    
    /**
     * 메시지 ID로 메시지 조회
     * @param messageId 메시지 ID
     * @return 메시지
     */
    public Optional<ChatMessage> getMessageById(Long messageId) {
        return chatMessageRepository.findById(messageId);
    }
    
    /**
     * 클라이언트 메시지 ID로 메시지 조회
     * @param senderId 발신자 ID
     * @param clientMessageId 클라이언트 메시지 ID
     * @return 메시지
     */
    public Optional<ChatMessage> getMessageByClientId(Long senderId, String clientMessageId) {
        return chatMessageRepository.findBySenderIdAndClientMessageId(senderId, clientMessageId);
    }
    
    /**
     * 메시지 삭제
     * @param messageId 메시지 ID
     * @param userId 사용자 ID (권한 확인용)
     * @return 삭제 성공 여부
     */
    public boolean deleteMessage(Long messageId, Long userId) {
        Optional<ChatMessage> messageOpt = chatMessageRepository.findById(messageId);
        
        if (messageOpt.isPresent()) {
            ChatMessage message = messageOpt.get();
            
            // 메시지 작성자만 삭제 가능
            if (message.getSenderId().equals(userId)) {
                chatMessageRepository.delete(message);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 특정 미팅의 메시지 수 조회
     * @param meetupId 미팅 ID
     * @return 메시지 수
     */
    public long getMessageCount(Long meetupId) {
        return chatMessageRepository.countByMeetupId(meetupId);
    }
    
    /**
     * 특정 사용자가 보낸 메시지 수 조회
     * @param userId 사용자 ID
     * @return 메시지 수
     */
    public long getMessageCountByUser(Long userId) {
        return chatMessageRepository.countBySenderId(userId);
    }
    
    /**
     * 오래된 메시지 정리 (스케줄러에서 사용)
     * @param daysToKeep 보관할 일수
     */
    public void cleanupOldMessages(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        chatMessageRepository.deleteBySentAtBefore(cutoffDate);
    }
    
    /**
     * 메시지 포맷팅 미리보기 생성
     * @param content 메시지 내용
     * @return 포맷팅된 메시지 응답
     */
    public MessageFormattingService.FormattedMessageResponse previewMessageFormatting(String content) {
        if (content == null || content.trim().isEmpty()) {
            return new MessageFormattingService.FormattedMessageResponse("", "", "", "", false);
        }
        
        // 메시지 정화
        String sanitizedContent = messageFormattingService.sanitizeMessage(content);
        
        // 메시지 포맷팅
        String formattedContent = messageFormattingService.formatMessage(sanitizedContent);
        
        // 플레인 텍스트 추출
        String plainTextContent = messageFormattingService.extractPlainText(formattedContent);
        
        // 미리보기 생성
        String preview = messageFormattingService.generatePreview(sanitizedContent, 100);
        
        // 포맷팅 여부 확인
        boolean hasFormatting = !sanitizedContent.equals(formattedContent);
        
        return new MessageFormattingService.FormattedMessageResponse(
            content, formattedContent, plainTextContent, preview, hasFormatting
        );
    }
    
    /**
     * 메시지 내용 검증
     * @param content 메시지 내용
     * @return 검증 결과
     */
    public MessageFormattingService.ValidationResult validateMessageContent(String content) {
        return messageFormattingService.validateMessage(content);
    }
}