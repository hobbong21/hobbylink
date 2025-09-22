package com.hobbylink.repository;

import com.hobbylink.model.Studio;
import com.hobbylink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudioRepository extends JpaRepository<Studio, Long> {
    List<Studio> findByCreator(User creator);
    List<Studio> findByCategory(String category);
    List<Studio> findByNameContainingIgnoreCase(String name);
    List<Studio> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
    List<Studio> findByCategoryAndNameContainingIgnoreCaseOrCategoryAndDescriptionContainingIgnoreCase(
        String category1, String name, String category2, String description);
}