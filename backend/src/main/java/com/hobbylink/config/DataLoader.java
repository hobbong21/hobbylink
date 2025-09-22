package com.hobbylink.config;

import com.hobbylink.model.User;
import com.hobbylink.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;

    @Autowired
    public DataLoader(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        // Load sample users
        loadUsers();
    }

    private void loadUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User("johndoe", "john@example.com", "John", "Doe"));
            userRepository.save(new User("janedoe", "jane@example.com", "Jane", "Doe"));
            userRepository.save(new User("bobsmith", "bob@example.com", "Bob", "Smith"));
            
            System.out.println("Sample users loaded!");
        }
    }
}