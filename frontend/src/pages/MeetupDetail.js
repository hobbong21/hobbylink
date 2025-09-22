import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const MeetupDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [meetup, setMeetup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);

  useEffect(() => {
    fetchMeetup();
    checkParticipationStatus();
  }, [id]);

  const fetchMeetup = async () => {
    try {
      const response = await axios.get(`/api/meetups/${id}`);
      setMeetup(response.data);
    } catch (error) {
      console.error('Error fetching meetup:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkParticipationStatus = async () => {
    try {
      // For demo purposes, check if user 1 is participating
      const response = await axios.get(`/api/meetups/${id}/participants`);
      const participants = response.data;
      const isUserParticipating = participants.some(p => p.user?.id === 1);
      setIsParticipating(isUserParticipating);
    } catch (error) {
      console.error('Error checking participation status:', error);
    }
  };

  const handleJoinMeetup = async () => {
    try {
      // For demo purposes, using user ID 1
      await axios.post(`/api/meetups/${id}/join?userId=1`);
      setIsParticipating(true);
      fetchMeetup(); // Refresh meetup data
    } catch (error) {
      console.error('Error joining meetup:', error);
      alert('Failed to join meetup. Please try again.');
    }
  };

  const handleLeaveMeetup = async () => {
    try {
      // For demo purposes, using user ID 1
      await axios.post(`/api/meetups/${id}/leave?userId=1`);
      setIsParticipating(false);
      fetchMeetup(); // Refresh meetup data
    } catch (error) {
      console.error('Error leaving meetup:', error);
      alert('Failed to leave meetup. Please try again.');
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  const getTimeUntilMeetup = (dateTime) => {
    const now = new Date();
    const meetupTime = new Date(dateTime);
    const diffInMs = meetupTime - now;
    
    if (diffInMs < 0) {
      return 'Event has started';
    }
    
    const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.ceil(diffInMs / (1000 * 60));
      return `Starting in ${diffInMinutes} minutes`;
    } else if (diffInHours < 24) {
      return `Starting in ${diffInHours} hours`;
    } else {
      const diffInDays = Math.ceil(diffInHours / 24);
      return `Starting in ${diffInDays} days`;
    }
  };

  if (loading) {
    return <div className="container">{t('common.loading')}</div>;
  }

  if (!meetup) {
    return <div className="container">{t('common.meetupNotFound')}</div>;
  }

  return (
    <div className="container">
      <div className="meetup-detail">
        <div className="meetup-header">
          <h1>{meetup.title}</h1>
          <div className="meetup-badges">
            {meetup.type === 'SPONTANEOUS' && (
              <span className="badge spontaneous">{t('meetups.spontaneous')}</span>
            )}
            <span className="badge time-badge">
              {getTimeUntilMeetup(meetup.meetupDateTime)}
            </span>
          </div>
        </div>

        <div className="meetup-content">
          <div className="meetup-main" style={{ width: '100%' }}>
            <div className="meetup-description">
              <p>{meetup.description}</p>
            </div>

            <div className="meetup-info-grid">
              <div className="info-item">
                <strong>{t('meetupDetail.when')}</strong>
                <p>📅 {formatDateTime(meetup.meetupDateTime)}</p>
              </div>
              
              {meetup.location && (
                <div className="info-item">
                  <strong>{t('meetupDetail.where')}</strong>
                  <p>📍 {meetup.location}</p>
                </div>
              )}
              
              <div className="info-item">
                <strong>{t('meetupDetail.organizer')}</strong>
                <p>👤 {meetup.creator?.username}</p>
              </div>
              
              <div className="info-item">
                <strong>{t('meetupDetail.participants')}</strong>
                <p>👥 {meetup.currentParticipants || 0}
                {meetup.maxParticipants && ` / ${meetup.maxParticipants}`}</p>
              </div>
            </div>

            {meetup.category && (
              <div className="meetup-category">
                <span className="tag">{meetup.category}</span>
              </div>
            )}

            <div className="meetup-actions">
              {!isParticipating ? (
                <button onClick={handleJoinMeetup} className="btn btn-primary">
                  {t('meetups.joinMeetup')}
                </button>
              ) : (
                <>
                  <button onClick={handleLeaveMeetup} className="btn btn-secondary">
                    {t('meetups.leaveMeetup')}
                  </button>
                  <Link to={`/meetups/${id}/chat`} className="btn btn-primary">
                    <i className="fas fa-comments"></i> {t('meetups.openChat')}
                  </Link>
                </>
              )}
              <Link to="/meetups" className="btn btn-outline">
                Back to Meetups
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetupDetail;