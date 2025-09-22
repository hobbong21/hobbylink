package com.hobbylink.repository;

import com.hobbylink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);
    
    // SearchService에서 필요한 메서드들 추가
    List<User> findByUsernameContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
        String username, String firstName, String lastName);
    List<User> findByLocationContainingIgnoreCaseAndUsernameContainingIgnoreCase(String location, String username);
    List<User> findByLocationContainingIgnoreCase(String location);
}