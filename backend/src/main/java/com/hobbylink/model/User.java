package com.hobbylink.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.hobbylink.model.enums.Gender;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 100)
    private String username;
    
    @Column(nullable = false, length = 255)
    private String password;
    
    @Column(length = 100)
    private String nickname;
    
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;
    
    @Column(length = 50)
    private String role = "USER";
    
    @Column(name = "join_date")
    private LocalDate joinDate;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    // Additional fields for user profile
    @Column(length = 100)
    private String email;
    
    @Column(name = "first_name", length = 50)
    private String firstName;
    
    @Column(name = "last_name", length = 50)
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    @Column(length = 500)
    private String bio;
    
    @Column(length = 500)
    private String hobbies;
    
    @Column(length = 500)
    private String interests;
    
    @Column(length = 200)
    private String location;
    
    private Double latitude;
    
    private Double longitude;
    
    @Column(name = "profile_image", length = 500)
    private String profileImage;
    
    @Column(name = "average_rating")
    private Double averageRating = 0.0;
    
    @Column(name = "total_ratings")
    private Integer totalRatings = 0;
    
    @Column(name = "reputation_score")
    private Integer reputationScore = 0;
    
    @Column(name = "kakao_id", length = 100)
    private String kakaoId;
    
    @Column(name = "naver_id", length = 100)
    private String naverId;
    
    @Column(name = "google_id", length = 100)
    private String googleId;
    
    // 연관관계
    @OneToMany(mappedBy = "creator", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HobbyGroup> createdGroups;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<HobbyGroupMember> groupMemberships;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BoardPost> posts;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments;
    
    // 기본 생성자
    public User() {
        this.joinDate = LocalDate.now();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // 생성자
    public User(String username, String password, String nickname) {
        this();
        this.username = username;
        this.password = password;
        this.nickname = nickname;
    }
    
    // 추가 생성자 (DataLoader용)
    public User(String username, String email, String firstName, String lastName) {
        this();
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.password = "defaultPassword"; // 기본 패스워드 설정
        this.nickname = firstName + " " + lastName;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public LocalDate getJoinDate() {
        return joinDate;
    }
    
    public void setJoinDate(LocalDate joinDate) {
        this.joinDate = joinDate;
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
    
    public List<HobbyGroup> getCreatedGroups() {
        return createdGroups;
    }
    
    public void setCreatedGroups(List<HobbyGroup> createdGroups) {
        this.createdGroups = createdGroups;
    }
    
    public List<HobbyGroupMember> getGroupMemberships() {
        return groupMemberships;
    }
    
    public void setGroupMemberships(List<HobbyGroupMember> groupMemberships) {
        this.groupMemberships = groupMemberships;
    }
    
    public List<BoardPost> getPosts() {
        return posts;
    }
    
    public void setPosts(List<BoardPost> posts) {
        this.posts = posts;
    }
    
    public List<Comment> getComments() {
        return comments;
    }
    
    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }
    
    // Additional getters and setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public Gender getGender() {
        return gender;
    }
    
    public void setGender(Gender gender) {
        this.gender = gender;
    }
    
    public String getBio() {
        return bio;
    }
    
    public void setBio(String bio) {
        this.bio = bio;
    }
    
    public String getHobbies() {
        return hobbies;
    }
    
    public void setHobbies(String hobbies) {
        this.hobbies = hobbies;
    }
    
    public String getInterests() {
        return interests;
    }
    
    public void setInterests(String interests) {
        this.interests = interests;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    public String getProfileImage() {
        return profileImage;
    }
    
    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
    
    public Double getAverageRating() {
        return averageRating;
    }
    
    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }
    
    public Integer getTotalRatings() {
        return totalRatings;
    }
    
    public void setTotalRatings(Integer totalRatings) {
        this.totalRatings = totalRatings;
    }
    
    public Integer getReputationScore() {
        return reputationScore;
    }
    
    public void setReputationScore(Integer reputationScore) {
        this.reputationScore = reputationScore;
    }
    
    public String getKakaoId() {
        return kakaoId;
    }
    
    public void setKakaoId(String kakaoId) {
        this.kakaoId = kakaoId;
    }
    
    public String getNaverId() {
        return naverId;
    }
    
    public void setNaverId(String naverId) {
        this.naverId = naverId;
    }
    
    public String getGoogleId() {
        return googleId;
    }
    
    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}