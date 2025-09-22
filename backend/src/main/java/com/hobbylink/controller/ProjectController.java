package com.hobbylink.controller;

import com.hobbylink.model.Project;
import com.hobbylink.service.ProjectService;
import com.hobbylink.service.UserService;
import com.hobbylink.service.StudioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:3000")
public class ProjectController {
    
    @Autowired
    private ProjectService projectService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private StudioService studioService;
    
    @GetMapping
    public List<Project> getAllProjects() {
        return projectService.getAllProjects();
    }
    
    @GetMapping("/recent")
    public List<Project> getRecentProjects() {
        return projectService.getRecentProjects();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id)
            .map(project -> ResponseEntity.ok().body(project))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Project>> getProjectsByUser(@PathVariable Long userId) {
        return userService.getUserById(userId)
            .map(user -> ResponseEntity.ok(projectService.getProjectsByUser(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/studio/{studioId}")
    public ResponseEntity<List<Project>> getProjectsByStudio(@PathVariable Long studioId) {
        return studioService.getStudioById(studioId)
            .map(studio -> ResponseEntity.ok(projectService.getProjectsByStudio(studio)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public List<Project> searchProjects(@RequestParam String title) {
        return projectService.searchProjectsByTitle(title);
    }
    
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        Project createdProject = projectService.createProject(project);
        return ResponseEntity.ok(createdProject);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project projectDetails) {
        try {
            Project updatedProject = projectService.updateProject(id, projectDetails);
            return ResponseEntity.ok(updatedProject);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok().build();
    }
}