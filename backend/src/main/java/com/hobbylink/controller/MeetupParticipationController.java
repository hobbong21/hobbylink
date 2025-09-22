package com.hobbylink.controller;

import com.hobbylink.model.MeetupParticipation;
import com.hobbylink.service.MeetupParticipationService;
import com.hobbylink.service.MeetupService;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/meetups")
@CrossOrigin(origins = "http://localhost:3000")
public class MeetupParticipationController {
    
    @Autowired
    private MeetupParticipationService participationService;
    
    @Autowired
    private MeetupService meetupService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/{meetupId}/join")
    public ResponseEntity<MeetupParticipation> joinMeetup(
            @PathVariable Long meetupId,
            @RequestParam Long userId) {
        try {
            var meetup = meetupService.getMeetupById(meetupId)
                .orElseThrow(() -> new RuntimeException("Meetup not found"));
            var user = userService.getUserById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            MeetupParticipation participation = participationService.joinMeetup(meetup, user);
            return ResponseEntity.ok(participation);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{meetupId}/leave")
    public ResponseEntity<?> leaveMeetup(
            @PathVariable Long meetupId,
            @RequestParam Long userId) {
        try {
            var meetup = meetupService.getMeetupById(meetupId)
                .orElseThrow(() -> new RuntimeException("Meetup not found"));
            var user = userService.getUserById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            participationService.leaveMeetup(meetup, user);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{meetupId}/participants")
    public ResponseEntity<List<MeetupParticipation>> getMeetupParticipants(@PathVariable Long meetupId) {
        return meetupService.getMeetupById(meetupId)
            .map(meetup -> ResponseEntity.ok(participationService.getMeetupParticipants(meetup)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{meetupId}/participants/count")
    public ResponseEntity<Integer> getParticipantCount(@PathVariable Long meetupId) {
        return meetupService.getMeetupById(meetupId)
            .map(meetup -> ResponseEntity.ok(participationService.getParticipantCount(meetup)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{meetupId}/participants/{userId}/status")
    public ResponseEntity<Boolean> getParticipationStatus(
            @PathVariable Long meetupId,
            @PathVariable Long userId) {
        try {
            var meetup = meetupService.getMeetupById(meetupId)
                .orElseThrow(() -> new RuntimeException("Meetup not found"));
            var user = userService.getUserById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            boolean isParticipating = participationService.isUserParticipating(meetup, user);
            return ResponseEntity.ok(isParticipating);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}