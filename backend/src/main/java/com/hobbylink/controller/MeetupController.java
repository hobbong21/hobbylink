package com.hobbylink.controller;

import com.hobbylink.model.Meetup;
import com.hobbylink.service.MeetupService;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/meetups")
@CrossOrigin(origins = "http://localhost:3000")
public class MeetupController {
    
    @Autowired
    private MeetupService meetupService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<Meetup> getAllMeetups() {
        return meetupService.getAllMeetups();
    }
    
    @GetMapping("/active")
    public List<Meetup> getActiveMeetups() {
        return meetupService.getActiveMeetups();
    }
    
    @GetMapping("/spontaneous")
    public List<Meetup> getSpontaneousMeetups() {
        return meetupService.getSpontaneousMeetups();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Meetup> getMeetupById(@PathVariable Long id) {
        return meetupService.getMeetupById(id)
            .map(meetup -> ResponseEntity.ok().body(meetup))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/creator/{creatorId}")
    public ResponseEntity<List<Meetup>> getMeetupsByCreator(@PathVariable Long creatorId) {
        return userService.getUserById(creatorId)
            .map(user -> ResponseEntity.ok(meetupService.getMeetupsByCreator(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public List<Meetup> getMeetupsByCategory(@PathVariable String category) {
        return meetupService.getMeetupsByCategory(category);
    }
    
    @GetMapping("/search")
    public List<Meetup> searchMeetups(@RequestParam String title) {
        return meetupService.searchMeetupsByTitle(title);
    }
    
    @GetMapping("/nearby")
    public List<Meetup> getNearbyMeetups(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "10.0") Double radius,
            @RequestParam(required = false) String category) {
        return meetupService.getNearbyMeetups(latitude, longitude, radius, category);
    }
    
    @GetMapping("/recommended/{userId}")
    public ResponseEntity<List<Meetup>> getRecommendedMeetups(@PathVariable Long userId) {
        return userService.getUserById(userId)
            .map(user -> ResponseEntity.ok(meetupService.getRecommendedMeetups(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Meetup> createMeetup(@RequestBody Meetup meetup) {
        Meetup createdMeetup = meetupService.createMeetup(meetup);
        return ResponseEntity.ok(createdMeetup);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Meetup> updateMeetup(@PathVariable Long id, @RequestBody Meetup meetupDetails) {
        try {
            Meetup updatedMeetup = meetupService.updateMeetup(id, meetupDetails);
            return ResponseEntity.ok(updatedMeetup);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMeetup(@PathVariable Long id) {
        meetupService.deleteMeetup(id);
        return ResponseEntity.ok().build();
    }
}