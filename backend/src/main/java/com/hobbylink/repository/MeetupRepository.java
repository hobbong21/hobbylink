package com.hobbylink.repository;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetupRepository extends JpaRepository<Meetup, Long> {
    List<Meetup> findByCreator(User creator);
    List<Meetup> findByCategory(String category);
    List<Meetup> findByTitleContainingIgnoreCase(String title);
    List<Meetup> findByMeetupDateTimeAfterOrderByMeetupDateTimeAsc(LocalDateTime dateTime);
    List<Meetup> findByExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime dateTime);
    List<Meetup> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
    List<Meetup> findByCategoryAndTitleContainingIgnoreCase(String category, String title);
    List<Meetup> findByCategoryAndLocationContainingIgnoreCase(String category, String location);
    List<Meetup> findByCategoryAndLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
        String category, String location, String title);
    List<Meetup> findByLocationContainingIgnoreCase(String location);
    List<Meetup> findByLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(String location, String title);
    
    @Query("SELECT m FROM Meetup m WHERE m.meetupDateTime > :now AND " +
           "(:category IS NULL OR m.category = :category) AND " +
           "(:latitude IS NULL OR :longitude IS NULL OR " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(m.latitude)) * " +
           "cos(radians(m.longitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(m.latitude)))) <= :radius)")
    List<Meetup> findNearbyMeetups(@Param("now") LocalDateTime now,
                                   @Param("latitude") Double latitude,
                                   @Param("longitude") Double longitude,
                                   @Param("radius") Double radius,
                                   @Param("category") String category);
}