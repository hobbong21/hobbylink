package com.hobbylink.service;

import com.hobbylink.model.Studio;
import com.hobbylink.model.User;
import com.hobbylink.repository.StudioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class StudioService {
    
    @Autowired
    private StudioRepository studioRepository;
    
    public List<Studio> getAllStudios() {
        return studioRepository.findAll();
    }
    
    public Optional<Studio> getStudioById(Long id) {
        return studioRepository.findById(id);
    }
    
    public List<Studio> getStudiosByCreator(User creator) {
        return studioRepository.findByCreator(creator);
    }
    
    public List<Studio> getStudiosByCategory(String category) {
        return studioRepository.findByCategory(category);
    }
    
    public List<Studio> searchStudiosByName(String name) {
        return studioRepository.findByNameContainingIgnoreCase(name);
    }
    
    public Studio createStudio(Studio studio) {
        return studioRepository.save(studio);
    }
    
    public Studio updateStudio(Long id, Studio studioDetails) {
        Studio studio = studioRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Studio not found"));
        
        studio.setName(studioDetails.getName());
        studio.setDescription(studioDetails.getDescription());
        studio.setCoverImage(studioDetails.getCoverImage());
        studio.setCategory(studioDetails.getCategory());
        
        return studioRepository.save(studio);
    }
    
    public void deleteStudio(Long id) {
        studioRepository.deleteById(id);
    }
}