package com.hobbylink.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "hobby_group")
public class HobbyGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(columnDefinition = "CLOB")
    private String description;
    
    @Column(name = "location_lng")
    private Double locationLng;
    
    @Column(name = "location_lat")
    private Double locationLat;
    
    @Column(name = "reg_date")
    private LocalDate regDate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @OneToMany(mappedBy = "hobbyGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HobbyGroupMember> members;
    
    @OneToMany(mappedBy = "hobbyGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BoardPost> posts;
    
    @OneToMany(mappedBy = "hobbyGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ChatRoom> chatRooms;
    
    // 기본 생성자
    public HobbyGroup() {
        this.regDate = LocalDate.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // 생성자
    public HobbyGroup(String name, String description, User creator) {
        this();
        this.name = name;
        this.description = description;
        this.creator = creator;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Double getLocationLng() {
        return locationLng;
    }
    
    public void setLocationLng(Double locationLng) {
        this.locationLng = locationLng;
    }
    
    public Double getLocationLat() {
        return locationLat;
    }
    
    public void setLocationLat(Double locationLat) {
        this.locationLat = locationLat;
    }
    
    public LocalDate getRegDate() {
        return regDate;
    }
    
    public void setRegDate(LocalDate regDate) {
        this.regDate = regDate;
    }
    
    public User getCreator() {
        return creator;
    }
    
    public void setCreator(User creator) {
        this.creator = creator;
    }
    
    public Category getCategory() {
        return category;
    }
    
    public void setCategory(Category category) {
        this.category = category;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
    
    public Long getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public List<HobbyGroupMember> getMembers() {
        return members;
    }
    
    public void setMembers(List<HobbyGroupMember> members) {
        this.members = members;
    }
    
    public List<BoardPost> getPosts() {
        return posts;
    }
    
    public void setPosts(List<BoardPost> posts) {
        this.posts = posts;
    }
    
    public List<ChatRoom> getChatRooms() {
        return chatRooms;
    }
    
    public void setChatRooms(List<ChatRoom> chatRooms) {
        this.chatRooms = chatRooms;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}