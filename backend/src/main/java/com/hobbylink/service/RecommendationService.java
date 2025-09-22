package com.hobbylink.service;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.User;
import com.hobbylink.repository.MeetupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    
    @Autowired
    private MeetupRepository meetupRepository;
    
    public List<Meetup> getRecommendedMeetups(User user) {
        // AI-based recommendation logic
        List<Meetup> allMeetups = meetupRepository.findByMeetupDateTimeAfterOrderByMeetupDateTimeAsc(LocalDateTime.now());
        
        return allMeetups.stream()
            .filter(meetup -> isRecommendedForUser(meetup, user))
            .limit(10)
            .collect(Collectors.toList());
    }
    
    private boolean isRecommendedForUser(Meetup meetup, User user) {
        // Reputation filter - only show meetups from users with good reputation
        if (meetup.getCreator().getReputationScore() < 50) {
            return false;
        }
        
        // Interest matching
        if (user.getInterests() != null && meetup.getCategory() != null) {
            String[] userInterests = user.getInterests().toLowerCase().split(",");
            String meetupCategory = meetup.getCategory().toLowerCase();
            
            for (String interest : userInterests) {
                if (meetupCategory.contains(interest.trim())) {
                    return true;
                }
            }
        }
        
        // Location-based filtering (within 10km)
        if (user.getLatitude() != null && user.getLongitude() != null &&
            meetup.getLatitude() != null && meetup.getLongitude() != null) {
            double distance = calculateDistance(
                user.getLatitude(), user.getLongitude(),
                meetup.getLatitude(), meetup.getLongitude()
            );
            return distance <= 10.0; // 10km radius
        }
        
        return true;
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}