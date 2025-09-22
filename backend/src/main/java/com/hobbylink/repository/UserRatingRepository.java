package com.hobbylink.repository;

import com.hobbylink.model.User;
import com.hobbylink.model.UserRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRatingRepository extends JpaRepository<UserRating, Long> {
    List<UserRating> findByRatedUser(User ratedUser);
    List<UserRating> findByRater(User rater);
    
    @Query("SELECT AVG(r.rating) FROM UserRating r WHERE r.ratedUser = :user")
    Double findAverageRatingByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(r) FROM UserRating r WHERE r.ratedUser = :user")
    Long countRatingsByUser(@Param("user") User user);
}