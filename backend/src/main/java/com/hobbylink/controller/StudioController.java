package com.hobbylink.controller;

import com.hobbylink.model.Studio;
import com.hobbylink.service.StudioService;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/studios")
@CrossOrigin(origins = "http://localhost:3000")
public class StudioController {
    
    @Autowired
    private StudioService studioService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<Studio> getAllStudios() {
        return studioService.getAllStudios();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Studio> getStudioById(@PathVariable Long id) {
        return studioService.getStudioById(id)
            .map(studio -> ResponseEntity.ok().body(studio))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<Studio>> getStudiosByCreator(@PathVariable Long creatorId) {
        return userService.getUserById(creatorId)
            .map(user -> ResponseEntity.ok(studioService.getStudiosByCreator(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public List<Studio> getStudiosByCategory(@PathVariable String category) {
        return studioService.getStudiosByCategory(category);
    }
    
    @GetMapping("/search")
    public List<Studio> searchStudios(@RequestParam String name) {
        return studioService.searchStudiosByName(name);
    }
    
    @PostMapping
    public ResponseEntity<Studio> createStudio(@RequestBody Studio studio) {
        Studio createdStudio = studioService.createStudio(studio);
        return ResponseEntity.ok(createdStudio);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Studio> updateStudio(@PathVariable Long id, @RequestBody Studio studioDetails) {
        try {
            Studio updatedStudio = studioService.updateStudio(id, studioDetails);
            return ResponseEntity.ok(updatedStudio);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudio(@PathVariable Long id) {
        studioService.deleteStudio(id);
        return ResponseEntity.ok().build();
    }
}