package com.hobbylink.service;

import com.hobbylink.model.Project;
import com.hobbylink.model.Studio;
import com.hobbylink.model.User;
import com.hobbylink.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {
    
    @Autowired
    private ProjectRepository projectRepository;
    
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
    
    public List<Project> getRecentProjects() {
        return projectRepository.findByOrderByCreatedAtDesc();
    }
    
    public Optional<Project> getProjectById(Long id) {
        return projectRepository.findById(id);
    }
    
    public List<Project> getProjectsByUser(User user) {
        return projectRepository.findByUser(user);
    }
    
    public List<Project> getProjectsByStudio(Studio studio) {
        return projectRepository.findByStudio(studio);
    }
    
    public List<Project> searchProjectsByTitle(String title) {
        return projectRepository.findByTitleContainingIgnoreCase(title);
    }
    
    public Project createProject(Project project) {
        return projectRepository.save(project);
    }
    
    public Project updateProject(Long id, Project projectDetails) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        project.setTitle(projectDetails.getTitle());
        project.setDescription(projectDetails.getDescription());
        project.setImageUrl(projectDetails.getImageUrl());
        project.setProjectUrl(projectDetails.getProjectUrl());
        project.setTags(projectDetails.getTags());
        
        return projectRepository.save(project);
    }
    
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}