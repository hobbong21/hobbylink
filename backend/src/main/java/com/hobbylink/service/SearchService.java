package com.hobbylink.service;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.Project;
import com.hobbylink.model.Studio;
import com.hobbylink.model.User;
import com.hobbylink.repository.MeetupRepository;
import com.hobbylink.repository.ProjectRepository;
import com.hobbylink.repository.StudioRepository;
import com.hobbylink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SearchService {
    
    @Autowired
    private StudioRepository studioRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private MeetupRepository meetupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Map<String, Object> globalSearch(String query) {
        Map<String, Object> results = new HashMap<>();
        
        if (query == null || query.trim().isEmpty()) {
            return results;
        }
        
        String searchTerm = query.trim();
        
        // Search studios
        List<Studio> studios = studioRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            searchTerm, searchTerm);
        results.put("studios", studios);
        
        // Search projects
        List<Project> projects = projectRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            searchTerm, searchTerm);
        results.put("projects", projects);
        
        // Search meetups
        List<Meetup> meetups = meetupRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            searchTerm, searchTerm);
        results.put("meetups", meetups);
        
        // Search users
        List<User> users = userRepository.findByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            searchTerm, searchTerm, searchTerm);
        results.put("users", users);
        
        return results;
    }
    
    public Map<String, Object> advancedSearch(String query, String type, String category, String location) {
        Map<String, Object> results = new HashMap<>();
        
        switch (type != null ? type.toLowerCase() : "all") {
            case "studios":
                results.put("studios", searchStudios(query, category));
                break;
            case "projects":
                results.put("projects", searchProjects(query, category));
                break;
            case "meetups":
                results.put("meetups", searchMeetups(query, category, location));
                break;
            case "users":
                results.put("users", searchUsers(query, location));
                break;
            default:
                return globalSearch(query);
        }
        
        return results;
    }
    
    private List<Studio> searchStudios(String query, String category) {
        if (category != null && !category.isEmpty()) {
            if (query != null && !query.isEmpty()) {
                return studioRepository.findByCategoryAndNameContainingIgnoreCaseOrCategoryAndDescriptionContainingIgnoreCase(
                    category, query, category, query);
            } else {
                return studioRepository.findByCategory(category);
            }
        } else if (query != null && !query.isEmpty()) {
            return studioRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
        }
        return studioRepository.findAll();
    }
    
    private List<Project> searchProjects(String query, String category) {
        if (query != null && !query.isEmpty()) {
            return projectRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrTagsContainingIgnoreCase(
                query, query, query);
        }
        return projectRepository.findAll();
    }
    
    private List<Meetup> searchMeetups(String query, String category, String location) {
        if (category != null && !category.isEmpty() && location != null && !location.isEmpty()) {
            if (query != null && !query.isEmpty()) {
                return meetupRepository.findByCategoryAndLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
                    category, location, query);
            } else {
                return meetupRepository.findByCategoryAndLocationContainingIgnoreCase(category, location);
            }
        } else if (category != null && !category.isEmpty()) {
            if (query != null && !query.isEmpty()) {
                return meetupRepository.findByCategoryAndTitleContainingIgnoreCase(category, query);
            } else {
                return meetupRepository.findByCategory(category);
            }
        } else if (location != null && !location.isEmpty()) {
            if (query != null && !query.isEmpty()) {
                return meetupRepository.findByLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(location, query);
            } else {
                return meetupRepository.findByLocationContainingIgnoreCase(location);
            }
        } else if (query != null && !query.isEmpty()) {
            return meetupRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
        }
        return meetupRepository.findAll();
    }
    
    private List<User> searchUsers(String query, String location) {
        if (location != null && !location.isEmpty()) {
            if (query != null && !query.isEmpty()) {
                return userRepository.findByLocationContainingIgnoreCaseAndUsernameContainingIgnoreCase(location, query);
            } else {
                return userRepository.findByLocationContainingIgnoreCase(location);
            }
        } else if (query != null && !query.isEmpty()) {
            return userRepository.findByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                query, query, query);
        }
        return userRepository.findAll();
    }
    
    public List<String> getSearchSuggestions(String query) {
        // This could be enhanced with a proper suggestion engine
        // For now, return simple suggestions based on existing data
        return List.of(
            query + " meetup",
            query + " project",
            query + " studio",
            "popular " + query,
            query + " in Seoul"
        );
    }
}