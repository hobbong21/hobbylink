package com.hobbylink.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meetup_participations")
public class MeetupParticipation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id")
    @JsonIgnoreProperties({"participations", "chatMessages"})
    private Meetup meetup;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"meetups", "participations", "password"})
    private User user;
    
    @Enumerated(EnumType.STRING)
    private ParticipationStatus status = ParticipationStatus.JOINED;
    
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;
    
    // Constructors
    public MeetupParticipation() {
        this.joinedAt = LocalDateTime.now();
    }
    
    public MeetupParticipation(Meetup meetup, User user) {
        this();
        this.meetup = meetup;
        this.user = user;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Meetup getMeetup() { return meetup; }
    public void setMeetup(Meetup meetup) { this.meetup = meetup; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public ParticipationStatus getStatus() { return status; }
    public void setStatus(ParticipationStatus status) { this.status = status; }
    
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}