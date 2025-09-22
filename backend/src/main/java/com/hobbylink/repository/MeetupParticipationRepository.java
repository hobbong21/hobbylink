package com.hobbylink.repository;

import com.hobbylink.model.Meetup;
import com.hobbylink.model.MeetupParticipation;
import com.hobbylink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeetupParticipationRepository extends JpaRepository<MeetupParticipation, Long> {
    
    List<MeetupParticipation> findByMeetup(Meetup meetup);
    
    List<MeetupParticipation> findByUser(User user);
    
    Optional<MeetupParticipation> findByMeetupAndUser(Meetup meetup, User user);
    
    int countByMeetup(Meetup meetup);
    
    List<MeetupParticipation> findByUserAndMeetupMeetupDateTimeAfterOrderByMeetupMeetupDateTimeAsc(
        User user, LocalDateTime dateTime);
    
    void deleteByMeetupAndUser(Meetup meetup, User user);
    
    /**
     * 특정 미팅의 참가자 목록 조회
     * @param meetupId 미팅 ID
     * @return 참가자 목록
     */
    @Query("SELECT mp.user FROM MeetupParticipation mp WHERE mp.meetup.id = :meetupId")
    List<User> findUsersByMeetupId(@Param("meetupId") Long meetupId);
    
    /**
     * 특정 미팅의 참가자 ID 목록 조회
     * @param meetupId 미팅 ID
     * @return 참가자 ID 목록
     */
    @Query("SELECT mp.user.id FROM MeetupParticipation mp WHERE mp.meetup.id = :meetupId")
    List<Long> findUserIdsByMeetupId(@Param("meetupId") Long meetupId);
    
    /**
     * 특정 사용자가 참여한 미팅 ID 목록 조회
     * @param userId 사용자 ID
     * @return 미팅 ID 목록
     */
    @Query("SELECT mp.meetup.id FROM MeetupParticipation mp WHERE mp.user.id = :userId")
    List<Long> findMeetupIdsByUserId(@Param("userId") Long userId);
}