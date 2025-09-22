package com.hobbylink.service;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.User;
import com.hobbylink.model.UserRating;
import com.hobbylink.repository.UserRatingRepository;
import com.hobbylink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserRatingService {
    
    @Autowired
    private UserRatingRepository ratingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public List<UserRating> getRatingsByUser(User user) {
        return ratingRepository.findByRatedUser(user);
    }
    
    public UserRating rateUser(Integer rating, String comment, User rater, User ratedUser, Meetup meetup) {
        if (rater.getId().equals(ratedUser.getId())) {
            throw new RuntimeException("Cannot rate yourself");
        }
        
        UserRating userRating = new UserRating(rating, rater, ratedUser, meetup);
        userRating.setComment(comment);
        
        UserRating saved = ratingRepository.save(userRating);
        updateUserRatingStats(ratedUser);
        
        return saved;
    }
    
    private void updateUserRatingStats(User user) {
        Double averageRating = ratingRepository.findAverageRatingByUser(user);
        Long totalRatings = ratingRepository.countRatingsByUser(user);
        
        user.setAverageRating(averageRating != null ? averageRating : 0.0);
        user.setTotalRatings(totalRatings.intValue());
        
        // Update reputation score based on ratings
        int reputationScore = calculateReputationScore(averageRating, totalRatings.intValue());
        user.setReputationScore(reputationScore);
        
        userRepository.save(user);
    }
    
    private int calculateReputationScore(Double averageRating, int totalRatings) {
        if (averageRating == null || totalRatings == 0) {
            return 100; // Default score
        }
        
        // Base score from average rating (0-100)
        int baseScore = (int) (averageRating * 20);
        
        // Bonus for having more ratings (reliability)
        int reliabilityBonus = Math.min(totalRatings * 2, 50);
        
        // Cap at 150 for excellent users
        return Math.min(baseScore + reliabilityBonus, 150);
    }
    
    public Double getUserAverageRating(User user) {
        return ratingRepository.findAverageRatingByUser(user);
    }
    
    public Long getUserTotalRatings(User user) {
        return ratingRepository.countRatingsByUser(user);
    }
}