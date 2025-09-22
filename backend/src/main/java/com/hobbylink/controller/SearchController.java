package com.hobbylink.controller;

import com.hobbylink.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = "http://localhost:3000")
public class SearchController {
    
    @Autowired
    private SearchService searchService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> globalSearch(@RequestParam String q) {
        Map<String, Object> results = searchService.globalSearch(q);
        return ResponseEntity.ok(results);
    }
    
    @GetMapping("/advanced")
    public ResponseEntity<Map<String, Object>> advancedSearch(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location) {
        
        Map<String, Object> results = searchService.advancedSearch(q, type, category, location);
        return ResponseEntity.ok(results);
    }
    
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSearchSuggestions(@RequestParam String q) {
        List<String> suggestions = searchService.getSearchSuggestions(q);
        return ResponseEntity.ok(suggestions);
    }
}