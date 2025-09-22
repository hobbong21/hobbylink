package com.hobbylink.service;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.User;
import com.hobbylink.repository.MeetupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MeetupService {
    
    @Autowired
    private MeetupRepository meetupRepository;
    
    @Autowired
    private RecommendationService recommendationService;
    
    public List<Meetup> getAllMeetups() {
        return meetupRepository.findAll();
    }
    
    public List<Meetup> getActiveMeetups() {
        return meetupRepository.findByMeetupDateTimeAfterOrderByMeetupDateTimeAsc(LocalDateTime.now());
    }
    
    public List<Meetup> getSpontaneousMeetups() {
        return meetupRepository.findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime.now());
    }
    
    public Optional<Meetup> getMeetupById(Long id) {
        return meetupRepository.findById(id);
    }
    
    public List<Meetup> getMeetupsByCreator(User creator) {
        return meetupRepository.findByCreator(creator);
    }
    
    public List<Meetup> getMeetupsByCategory(String category) {
        return meetupRepository.findByCategory(category);
    }
    
    public List<Meetup> searchMeetupsByTitle(String title) {
        return meetupRepository.findByTitleContainingIgnoreCase(title);
    }
    
    public List<Meetup> getNearbyMeetups(Double latitude, Double longitude, Double radius, String category) {
        return meetupRepository.findNearbyMeetups(LocalDateTime.now(), latitude, longitude, radius, category);
    }
    
    public List<Meetup> getRecommendedMeetups(User user) {
        return recommendationService.getRecommendedMeetups(user);
    }
    
    public Meetup createMeetup(Meetup meetup) {
        // Set expiration for spontaneous meetups (24 hours)
        if (meetup.getExpiresAt() == null) {
            meetup.setExpiresAt(LocalDateTime.now().plusHours(24));
        }
        return meetupRepository.save(meetup);
    }
    
    public Meetup updateMeetup(Long id, Meetup meetupDetails) {
        Meetup meetup = meetupRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Meetup not found"));
        
        meetup.setTitle(meetupDetails.getTitle());
        meetup.setDescription(meetupDetails.getDescription());
        meetup.setMeetupDateTime(meetupDetails.getMeetupDateTime());
        meetup.setLocation(meetupDetails.getLocation());
        meetup.setLatitude(meetupDetails.getLatitude());
        meetup.setLongitude(meetupDetails.getLongitude());
        meetup.setMaxParticipants(meetupDetails.getMaxParticipants());
        meetup.setCategory(meetupDetails.getCategory());
        meetup.setTags(meetupDetails.getTags());
        
        return meetupRepository.save(meetup);
    }
    
    public void deleteMeetup(Long id) {
        meetupRepository.deleteById(id);
    }
    
    public void incrementParticipants(Long meetupId) {
        Meetup meetup = meetupRepository.findById(meetupId)
            .orElseThrow(() -> new RuntimeException("Meetup not found"));
        meetup.setCurrentParticipants(meetup.getCurrentParticipants() + 1);
        meetupRepository.save(meetup);
    }
    
    public void decrementParticipants(Long meetupId) {
        Meetup meetup = meetupRepository.findById(meetupId)
            .orElseThrow(() -> new RuntimeException("Meetup not found"));
        meetup.setCurrentParticipants(Math.max(0, meetup.getCurrentParticipants() - 1));
        meetupRepository.save(meetup);
    }
}