package com.hobbylink.repository;

import com.hobbylink.model.Project;
import com.hobbylink.model.Studio;
import com.hobbylink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUser(User user);
    List<Project> findByStudio(Studio studio);
    List<Project> findByTitleContainingIgnoreCase(String title);
    List<Project> findByOrderByCreatedAtDesc();
    List<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String description);
    List<Project> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrTagsContainingIgnoreCase(
        String title, String description, String tags);
}