package com.hobbylink.service;

import com.hobbylink.model.Notification;
import com.hobbylink.model.User;
import com.hobbylink.model.Meetup;
import com.hobbylink.model.enums.NotificationType;
import com.hobbylink.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public Notification createNotification(String title, String message, NotificationType type, User user) {
        Notification notification = new Notification(title, message, type, user);
        notification = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket
        sendRealTimeNotification(notification);
        
        return notification;
    }
    
    public Notification createNotification(String title, String message, NotificationType type, User user, User sender) {
        Notification notification = new Notification(title, message, type, user, sender);
        notification = notificationRepository.save(notification);
        
        // Send real-time notification via WebSocket
        sendRealTimeNotification(notification);
        
        return notification;
    }
    
    public void sendRealTimeNotification(Notification notification) {
        // Send to specific user's notification channel
        messagingTemplate.convertAndSend(
            "/topic/notifications/" + notification.getUser().getId(),
            notification
        );
    }
    
    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findUnreadByUser(user);
    }
    
    public long getUnreadCount(User user) {
        return notificationRepository.countUnreadByUser(user);
    }
    
    public void markAsRead(Long notificationId, User user) {
        notificationRepository.findById(notificationId)
            .filter(notification -> notification.getUser().equals(user))
            .ifPresent(notification -> {
                notification.setIsRead(true);
                notificationRepository.save(notification);
            });
    }
    
    public void markAllAsRead(User user) {
        List<Notification> unreadNotifications = getUnreadNotifications(user);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }
    
    public void deleteNotification(Long notificationId, User user) {
        notificationRepository.findById(notificationId)
            .filter(notification -> notification.getUser().equals(user))
            .ifPresent(notificationRepository::delete);
    }
    
    // Meetup-specific notification methods
    public void notifyMeetupParticipants(Meetup meetup, String title, String message, NotificationType type, User sender) {
        meetup.getParticipations().forEach(participation -> {
            User participant = participation.getUser();
            if (!participant.equals(sender)) {
                Notification notification = createNotification(title, message, type, participant, sender);
                notification.setRelatedEntityId(meetup.getId());
                notification.setRelatedEntityType("MEETUP");
                notificationRepository.save(notification);
            }
        });
    }
    
    public void notifyNewParticipant(Meetup meetup, User newParticipant) {
        String title = "New Participant Joined";
        String message = newParticipant.getUsername() + " joined the meetup: " + meetup.getTitle();
        notifyMeetupParticipants(meetup, title, message, NotificationType.NEW_PARTICIPANT, newParticipant);
    }
    
    public void notifyParticipantLeft(Meetup meetup, User leftParticipant) {
        String title = "Participant Left";
        String message = leftParticipant.getUsername() + " left the meetup: " + meetup.getTitle();
        notifyMeetupParticipants(meetup, title, message, NotificationType.PARTICIPANT_LEFT, leftParticipant);
    }
    
    public void notifyMeetupReminder(Meetup meetup) {
        String title = "Meetup Reminder";
        String message = "Your meetup '" + meetup.getTitle() + "' is starting soon!";
        
        meetup.getParticipations().forEach(participation -> {
            User participant = participation.getUser();
            Notification notification = createNotification(title, message, NotificationType.MEETUP_REMINDER, participant);
            notification.setRelatedEntityId(meetup.getId());
            notification.setRelatedEntityType("MEETUP");
            notificationRepository.save(notification);
        });
    }
    
    public void notifyNewChatMessage(Meetup meetup, User sender, String messageContent) {
        String title = "New Message";
        String message = sender.getUsername() + " sent a message in " + meetup.getTitle();
        
        meetup.getParticipations().forEach(participation -> {
            User participant = participation.getUser();
            if (!participant.equals(sender)) {
                Notification notification = createNotification(title, message, NotificationType.NEW_CHAT_MESSAGE, participant, sender);
                notification.setRelatedEntityId(meetup.getId());
                notification.setRelatedEntityType("MEETUP");
                notificationRepository.save(notification);
            }
        });
    }
    
    // Clean up old notifications (older than 30 days)
    public void cleanupOldNotifications(User user) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        notificationRepository.deleteByUserAndCreatedAtBefore(user, thirtyDaysAgo);
    }
}