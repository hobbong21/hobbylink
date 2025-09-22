package com.hobbylink.config;

import com.hobbylink.model.User;
import com.hobbylink.model.Studio;
import com.hobbylink.model.Project;
import com.hobbylink.model.Meetup;
import com.hobbylink.model.enums.MeetupType;
import com.hobbylink.model.enums.Gender;
import com.hobbylink.repository.UserRepository;
import com.hobbylink.repository.StudioRepository;
import com.hobbylink.repository.ProjectRepository;
import com.hobbylink.repository.MeetupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private StudioRepository studioRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private MeetupRepository meetupRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            initializeData();
        }
    }
    
    private void initializeData() {
        // Create sample users
        User user1 = new User("john_doe", "john@example.com", "password");
        user1.setFirstName("John");
        user1.setLastName("Doe");
        user1.setGender(Gender.MALE);
        user1.setBio("Creative developer passionate about web technologies and building amazing user experiences. I love collaborating with other developers and designers to create innovative solutions.");
        user1.setHobbies("Photography, Hiking, Gaming, Reading");
        user1.setInterests("Technology, Web Development, AI, Startups");
        user1.setLocation("Gangnam, Seoul");
        user1.setLatitude(37.4979);
        user1.setLongitude(127.0276);
        user1.setProfileImage("https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=JD");
        user1.setAverageRating(4.5);
        user1.setTotalRatings(12);
        user1.setReputationScore(125);
        user1.setKakaoId("kakao_john_123");
        user1.setPassword(passwordEncoder.encode("password"));
        userRepository.save(user1);
        
        User user2 = new User("jane_smith", "jane@example.com", "password");
        user2.setFirstName("Jane");
        user2.setLastName("Smith");
        user2.setGender(Gender.FEMALE);
        user2.setBio("UI/UX designer and digital artist with 5+ years of experience. I specialize in creating beautiful, user-centered designs that solve real problems and delight users.");
        user2.setHobbies("Drawing, Yoga, Traveling, Cooking");
        user2.setInterests("Design, Art, Psychology, User Experience");
        user2.setLocation("Hongdae, Seoul");
        user2.setLatitude(37.5511);
        user2.setLongitude(126.9240);
        user2.setProfileImage("https://via.placeholder.com/200x200/E74C3C/FFFFFF?text=JS");
        user2.setAverageRating(4.8);
        user2.setTotalRatings(18);
        user2.setReputationScore(140);
        user2.setNaverId("naver_jane_456");
        user2.setGoogleId("google_jane_789");
        user2.setPassword(passwordEncoder.encode("password"));
        userRepository.save(user2);
        
        User user3 = new User("mike_wilson", "mike@example.com", "password");
        user3.setFirstName("Mike");
        user3.setLastName("Wilson");
        user3.setGender(Gender.MALE);
        user3.setBio("Full-stack developer and tech enthusiast who loves building scalable applications. Always eager to learn new technologies and share knowledge with the community.");
        user3.setHobbies("Coding, Music Production, Basketball, Board Games");
        user3.setInterests("Technology, Machine Learning, Blockchain, Open Source");
        user3.setLocation("Itaewon, Seoul");
        user3.setLatitude(37.5344);
        user3.setLongitude(126.9944);
        user3.setProfileImage("https://via.placeholder.com/200x200/2ECC71/FFFFFF?text=MW");
        user3.setAverageRating(4.2);
        user3.setTotalRatings(8);
        user3.setReputationScore(110);
        user3.setKakaoId("kakao_mike_321");
        user3.setGoogleId("google_mike_654");
        user3.setPassword(passwordEncoder.encode("password"));
        userRepository.save(user3);
        
        // Create sample studios
        Studio studio1 = new Studio("Creative Web Studio", "A studio focused on creating beautiful and functional web applications", user1);
        studio1.setCategory("Web Development");
        studio1.setCoverImage("https://via.placeholder.com/600x300");
        studioRepository.save(studio1);
        
        Studio studio2 = new Studio("Design Lab", "Experimental design studio exploring new visual concepts", user2);
        studio2.setCategory("Design");
        studio2.setCoverImage("https://via.placeholder.com/600x300");
        studioRepository.save(studio2);
        
        Studio studio3 = new Studio("Tech Innovations", "Building the future with cutting-edge technology", user3);
        studio3.setCategory("Technology");
        studio3.setCoverImage("https://via.placeholder.com/600x300");
        studioRepository.save(studio3);
        
        // Create sample projects
        Project project1 = new Project("E-commerce Platform", "A modern e-commerce platform built with React and Spring Boot. Features include user authentication, product catalog, shopping cart, and payment integration.", user1);
        project1.setImageUrl("https://via.placeholder.com/400x300");
        project1.setProjectUrl("https://example.com/ecommerce");
        project1.setTags("React, Spring Boot, E-commerce, Web Development");
        project1.setStudio(studio1);
        projectRepository.save(project1);
        
        Project project2 = new Project("Task Management App", "A collaborative task management application with real-time updates and team collaboration features.", user1);
        project2.setImageUrl("https://via.placeholder.com/400x300");
        project2.setProjectUrl("https://example.com/taskmanager");
        project2.setTags("React, Node.js, Real-time, Collaboration");
        project2.setStudio(studio1);
        projectRepository.save(project2);
        
        Project project3 = new Project("Brand Identity Design", "Complete brand identity design for a tech startup including logo, color palette, and brand guidelines.", user2);
        project3.setImageUrl("https://via.placeholder.com/400x300");
        project3.setTags("Branding, Logo Design, Visual Identity");
        project3.setStudio(studio2);
        projectRepository.save(project3);
        
        Project project4 = new Project("Mobile App UI/UX", "User interface and experience design for a fitness tracking mobile application.", user2);
        project4.setImageUrl("https://via.placeholder.com/400x300");
        project4.setTags("UI/UX, Mobile Design, Fitness App");
        project4.setStudio(studio2);
        projectRepository.save(project4);
        
        Project project5 = new Project("AI Chatbot", "Intelligent chatbot powered by machine learning for customer service automation.", user3);
        project5.setImageUrl("https://via.placeholder.com/400x300");
        project5.setProjectUrl("https://example.com/chatbot");
        project5.setTags("AI, Machine Learning, Chatbot, Python");
        project5.setStudio(studio3);
        projectRepository.save(project5);
        
        Project project6 = new Project("IoT Dashboard", "Real-time dashboard for monitoring IoT devices with data visualization and alerts.", user3);
        project6.setImageUrl("https://via.placeholder.com/400x300");
        project6.setProjectUrl("https://example.com/iot-dashboard");
        project6.setTags("IoT, Dashboard, Data Visualization, React");
        project6.setStudio(studio3);
        projectRepository.save(project6);
        
        // Create sample meetups
        Meetup meetup1 = new Meetup("Coffee & Code", "Let's meet for coffee and discuss coding projects. Bring your laptop!", LocalDateTime.now().plusDays(2), user1);
        meetup1.setLocation("Gangnam Station, Seoul");
        meetup1.setLatitude(37.4979);
        meetup1.setLongitude(127.0276);
        meetup1.setMaxParticipants(8);
        meetup1.setCurrentParticipants(3);
        meetup1.setCategory("Technology");
        meetup1.setTags("coding, coffee, networking");
        meetup1.setType(MeetupType.PLANNED);
        meetupRepository.save(meetup1);
        
        Meetup meetup2 = new Meetup("Spontaneous Art Walk", "Anyone want to explore art galleries in Hongdae? Starting in 2 hours!", LocalDateTime.now().plusHours(2), user2);
        meetup2.setLocation("Hongik University, Seoul");
        meetup2.setLatitude(37.5511);
        meetup2.setLongitude(126.9240);
        meetup2.setMaxParticipants(6);
        meetup2.setCurrentParticipants(1);
        meetup2.setCategory("Art");
        meetup2.setTags("art, gallery, spontaneous");
        meetup2.setType(MeetupType.SPONTANEOUS);
        meetup2.setExpiresAt(LocalDateTime.now().plusHours(6));
        meetupRepository.save(meetup2);
        
        Meetup meetup3 = new Meetup("Tech Startup Networking", "Monthly networking event for tech entrepreneurs and developers.", LocalDateTime.now().plusDays(5), user3);
        meetup3.setLocation("Coex Convention Center, Seoul");
        meetup3.setLatitude(37.5130);
        meetup3.setLongitude(127.0590);
        meetup3.setMaxParticipants(50);
        meetup3.setCurrentParticipants(12);
        meetup3.setCategory("Business");
        meetup3.setTags("networking, startup, business");
        meetup3.setType(MeetupType.PLANNED);
        meetupRepository.save(meetup3);
        
        Meetup meetup4 = new Meetup("Quick Lunch Meetup", "Anyone free for lunch in 1 hour? Let's grab Korean BBQ!", LocalDateTime.now().plusHours(1), user1);
        meetup4.setLocation("Myeongdong, Seoul");
        meetup4.setLatitude(37.5636);
        meetup4.setLongitude(126.9834);
        meetup4.setMaxParticipants(4);
        meetup4.setCurrentParticipants(2);
        meetup4.setCategory("Food");
        meetup4.setTags("lunch, food, spontaneous");
        meetup4.setType(MeetupType.SPONTANEOUS);
        meetup4.setExpiresAt(LocalDateTime.now().plusHours(3));
        meetupRepository.save(meetup4);
        
        System.out.println("Sample data initialized successfully!");
    }
}