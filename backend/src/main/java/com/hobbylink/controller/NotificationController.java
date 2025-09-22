package com.hobbylink.controller;

import com.hobbylink.model.Notification;
import com.hobbylink.service.NotificationService;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(@PathVariable Long userId) {
        return userService.getUserById(userId)
            .map(user -> ResponseEntity.ok(notificationService.getUserNotifications(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        return userService.getUserById(userId)
            .map(user -> ResponseEntity.ok(notificationService.getUnreadNotifications(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long userId) {
        return userService.getUserById(userId)
            .map(user -> {
                Map<String, Long> response = new HashMap<>();
                response.put("unreadCount", notificationService.getUnreadCount(user));
                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam Long userId) {
        return userService.getUserById(userId)
            .map(user -> {
                notificationService.markAsRead(notificationId, user);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long userId) {
        return userService.getUserById(userId)
            .map(user -> {
                notificationService.markAllAsRead(user);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long notificationId,
            @RequestParam Long userId) {
        return userService.getUserById(userId)
            .map(user -> {
                notificationService.deleteNotification(notificationId, user);
                return ResponseEntity.ok().build();
            })
            .orElse(ResponseEntity.notFound().build());
    }
}