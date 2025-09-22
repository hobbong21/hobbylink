package com.hobbylink.controller;

import com.hobbylink.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String email = request.get("email");
        
        Map<String, Object> response = authService.signUp(username, password, email);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<Map<String, Object>> signIn(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        Map<String, Object> response = authService.signIn(username, password);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        
        Map<String, Object> response = authService.validateToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signout")
    public ResponseEntity<Map<String, Object>> signOut() {
        return ResponseEntity.ok(Map.of("success", true, "message", "Signed out successfully"));
    }
}