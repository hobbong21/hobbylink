package com.hobbylink.controller;

import com.hobbylink.model.ChatMessage;
import com.hobbylink.model.User;
import com.hobbylink.service.ChatService;
import com.hobbylink.service.ConnectionManagerService;
import com.hobbylink.service.MeetupService;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 채팅 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/meetups")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private ConnectionManagerService connectionManagerService;
    
    @Autowired
    private MeetupService meetupService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 특정 미팅의 메시지 목록 조회
     * @param meetupId 미팅 ID
     * @return 메시지 목록
     */
    @GetMapping("/{meetupId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long meetupId) {
        try {
            List<ChatMessage> messages = chatService.getMessagesByMeetupId(meetupId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 특정 미팅의 메시지 페이지 조회
     * @param meetupId 미팅 ID
     * @param page 페이지 번호
     * @param size 페이지 크기
     * @return 메시지 페이지
     */
    @GetMapping("/{meetupId}/messages/page")
    public ResponseEntity<Page<ChatMessage>> getMessagesPage(
            @PathVariable Long meetupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<ChatMessage> messages = chatService.getMessagesByMeetupId(meetupId, page, size);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 특정 미팅의 온라인 사용자 목록 조회
     * @param meetupId 미팅 ID
     * @return 온라인 사용자 목록
     */
    @GetMapping("/{meetupId}/online-users")
    public ResponseEntity<List<User>> getOnlineUsers(@PathVariable Long meetupId) {
        try {
            List<User> onlineUsers = connectionManagerService.getOnlineUsers(meetupId);
            return ResponseEntity.ok(onlineUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 메시지 전송 (REST API)
     * @param meetupId 미팅 ID
     * @param request 메시지 요청
     * @return 전송된 메시지
     */
    @PostMapping("/{meetupId}/messages")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable Long meetupId,
            @RequestBody Map<String, Object> request) {
        try {
            String content = (String) request.get("content");
            Long senderId = Long.valueOf(request.get("senderId").toString());
            
            // 메시지 내용 검증 및 정화
            if (!chatService.isValidMessageContent(content)) {
                return ResponseEntity.badRequest().build();
            }
            
            content = chatService.sanitizeMessageContent(content);
            
            // 미팅과 사용자 조회
            var meetup = meetupService.getMeetupById(meetupId);
            var sender = userService.getUserById(senderId);
            
            if (!meetup.isPresent() || !sender.isPresent()) {
                return ResponseEntity.badRequest().build();
            }
            
            ChatMessage message = chatService.sendMessage(content, meetup.get(), sender.get());
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 메시지 삭제
     * @param messageId 메시지 ID
     * @param userId 사용자 ID
     * @return 삭제 결과
     */
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable Long messageId,
            @RequestParam Long userId) {
        try {
            boolean deleted = chatService.deleteMessage(messageId, userId);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 특정 미팅의 메시지 수 조회
     * @param meetupId 미팅 ID
     * @return 메시지 수
     */
    @GetMapping("/{meetupId}/messages/count")
    public ResponseEntity<Long> getMessageCount(@PathVariable Long meetupId) {
        try {
            long count = chatService.getMessageCount(meetupId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}