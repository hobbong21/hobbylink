package com.hobbylink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableScheduling
@RestController
public class HobbylinkApplication {

    public static void main(String[] args) {
        SpringApplication.run(HobbylinkApplication.class, args);
    }

    @GetMapping("/api/status")
    public String status() {
        return "HobbyLink Backend is running!";
    }
}