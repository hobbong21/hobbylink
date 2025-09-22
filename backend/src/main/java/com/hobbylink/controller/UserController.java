package com.hobbylink.controller;

import com.hobbylink.model.User;
import com.hobbylink.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
            return new ResponseEntity<>(updatedUser, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    /**
     * 현재 사용자 정보 조회 (데모용 - 실제로는 인증된 사용자 정보를 반환해야 함)
     * @return 현재 사용자 정보
     */
    @GetMapping("/current")
    public ResponseEntity<User> getCurrentUser() {
        // 데모용으로 ID가 1인 사용자를 반환
        // 실제 구현에서는 JWT 토큰이나 세션에서 사용자 정보를 가져와야 함
        Optional<User> user = userService.getUserById(1L);
        return user.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> {
                    // 기본 사용자가 없으면 생성
                    User defaultUser = new User();
                    defaultUser.setUsername("demo_user");
                    defaultUser.setEmail("demo@example.com");
                    User createdUser = userService.createUser(defaultUser);
                    return new ResponseEntity<>(createdUser, HttpStatus.OK);
                });
    }
}