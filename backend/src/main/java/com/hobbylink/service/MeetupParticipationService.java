package com.hobbylink.service;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.MeetupParticipation;
import com.hobbylink.model.User;
import com.hobbylink.repository.MeetupParticipationRepository;
import com.hobbylink.repository.MeetupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MeetupParticipationService {
    
    @Autowired
    private MeetupParticipationRepository participationRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private MeetupRepository meetupRepository;
    
    public MeetupParticipation joinMeetup(Meetup meetup, User user) {
        // Check if user is already participating
        if (isUserParticipating(meetup, user)) {
            throw new RuntimeException("User is already participating in this meetup");
        }
        
        // Check if meetup is full
        if (meetup.getMaxParticipants() != null && 
            meetup.getCurrentParticipants() >= meetup.getMaxParticipants()) {
            throw new RuntimeException("Meetup is full");
        }
        
        // Check if meetup is still active
        if (meetup.getMeetupDateTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot join past meetup");
        }
        
        // Create participation
        MeetupParticipation participation = new MeetupParticipation(meetup, user);
        participation = participationRepository.save(participation);
        
        // Update meetup participant count directly
        meetup.setCurrentParticipants(meetup.getCurrentParticipants() + 1);
        meetupRepository.save(meetup);
        
        // Send notification to other participants
        notificationService.notifyNewParticipant(meetup, user);
        
        return participation;
    }
    
    public void leaveMeetup(Meetup meetup, User user) {
        Optional<MeetupParticipation> participation = 
            participationRepository.findByMeetupAndUser(meetup, user);
        
        if (participation.isEmpty()) {
            throw new RuntimeException("User is not participating in this meetup");
        }
        
        participationRepository.delete(participation.get());
        
        // Update meetup participant count directly
        meetup.setCurrentParticipants(Math.max(0, meetup.getCurrentParticipants() - 1));
        meetupRepository.save(meetup);
        
        // Send notification to other participants
        notificationService.notifyParticipantLeft(meetup, user);
    }
    
    public List<MeetupParticipation> getMeetupParticipants(Meetup meetup) {
        return participationRepository.findByMeetup(meetup);
    }
    
    public List<MeetupParticipation> getUserParticipations(User user) {
        return participationRepository.findByUser(user);
    }
    
    public boolean isUserParticipating(Meetup meetup, User user) {
        return participationRepository.findByMeetupAndUser(meetup, user).isPresent();
    }
    
    public int getParticipantCount(Meetup meetup) {
        return participationRepository.countByMeetup(meetup);
    }
    
    public List<MeetupParticipation> getUpcomingParticipations(User user) {
        return participationRepository.findByUserAndMeetupMeetupDateTimeAfterOrderByMeetupMeetupDateTimeAsc(
            user, LocalDateTime.now());
    }
    
    /**
     * 특정 미팅의 참가자 목록 조회 (User 객체 반환)
     * @param meetupId 미팅 ID
     * @return 참가자 목록
     */
    public List<User> getMeetupParticipants(Long meetupId) {
        return participationRepository.findUsersByMeetupId(meetupId);
    }
    
    /**
     * 특정 미팅의 참가자 ID 목록 조회
     * @param meetupId 미팅 ID
     * @return 참가자 ID 목록
     */
    public List<Long> getMeetupParticipantIds(Long meetupId) {
        return participationRepository.findUserIdsByMeetupId(meetupId);
    }
    
    /**
     * 특정 사용자가 참여한 미팅 ID 목록 조회
     * @param userId 사용자 ID
     * @return 미팅 ID 목록
     */
    public List<Long> getUserMeetupIds(Long userId) {
        return participationRepository.findMeetupIdsByUserId(userId);
    }
}