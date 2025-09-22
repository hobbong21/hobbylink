package com.hobbylink.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hobbylink.model.enums.MeetupStatus;
import com.hobbylink.model.enums.MeetupType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "meetups")
public class Meetup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @NotNull
    private LocalDateTime meetupDateTime;
    
    private String location;
    private Double latitude;
    private Double longitude;
    
    private Integer maxParticipants;
    private Integer currentParticipants = 0;
    
    @Enumerated(EnumType.STRING)
    private MeetupStatus status = MeetupStatus.ACTIVE;
    
    @Enumerated(EnumType.STRING)
    private MeetupType type = MeetupType.SPONTANEOUS;
    
    private String category;
    private String tags;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    @JsonIgnoreProperties({"meetups", "participations", "password"})
    private User creator;
    
    @OneToMany(mappedBy = "meetup", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"meetup"})
    private List<MeetupParticipation> participations;
    
    @OneToMany(mappedBy = "meetup", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"meetup"})
    private List<ChatMessage> chatMessages;
    
    // Constructors
    public Meetup() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Meetup(String title, String description, LocalDateTime meetupDateTime, User creator) {
        this();
        this.title = title;
        this.description = description;
        this.meetupDateTime = meetupDateTime;
        this.creator = creator;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDateTime getMeetupDateTime() { return meetupDateTime; }
    public void setMeetupDateTime(LocalDateTime meetupDateTime) { this.meetupDateTime = meetupDateTime; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public Integer getMaxParticipants() { return maxParticipants; }
    public void setMaxParticipants(Integer maxParticipants) { this.maxParticipants = maxParticipants; }
    
    public Integer getCurrentParticipants() { return currentParticipants; }
    public void setCurrentParticipants(Integer currentParticipants) { this.currentParticipants = currentParticipants; }
    
    public MeetupStatus getStatus() { return status; }
    public void setStatus(MeetupStatus status) { this.status = status; }
    
    public MeetupType getType() { return type; }
    public void setType(MeetupType type) { this.type = type; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public User getCreator() { return creator; }
    public void setCreator(User creator) { this.creator = creator; }
    
    public List<MeetupParticipation> getParticipations() { return participations; }
    public void setParticipations(List<MeetupParticipation> participations) { this.participations = participations; }
    
    public List<ChatMessage> getChatMessages() { return chatMessages; }
    public void setChatMessages(List<ChatMessage> chatMessages) { this.chatMessages = chatMessages; }
}