import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import EnhancedChat from '../components/chat/EnhancedChat';
import './ChatPage.css';

/**
 * 채팅 페이지 컴포넌트
 */
const ChatPage = () => {
    const { t } = useTranslation();
    const { meetupId } = useParams();
    const [meetup, setMeetup] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // 현재 사용자 정보 가져오기
                const userResponse = await axios.get('/api/users/current');
                setCurrentUser(userResponse.data);
                
                // 미팅 정보 가져오기
                const meetupResponse = await axios.get(`/api/meetups/${meetupId}`);
                setMeetup(meetupResponse.data);
            } catch (err) {
                console.error('데이터 로드 실패:', err);
                setError(t('common.errorFetchingData'));
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [meetupId, t]);
    
    if (loading) {
        return (
            <div className="container">
                <div className="loading-spinner">
                    <p>{t('common.loading')}</p>
                </div>
            </div>
        );
    }
    
    if (error || !meetup) {
        return (
            <div className="container">
                <div className="error-message">
                    <p>{error || t('common.meetupNotFound')}</p>
                    <Link to="/meetups" className="btn btn-primary">
                        {t('common.backToMeetups')}
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="chat-page">
            <div className="chat-page-header">
                <div className="meetup-info">
                    <h1>{meetup.title}</h1>
                    <div className="meetup-meta">
                        <div className="meetup-date">
                            <i className="fas fa-calendar"></i>
                            <span>{new Date(meetup.meetupDateTime).toLocaleDateString()}</span>
                        </div>
                        {meetup.location && (
                            <div className="meetup-location">
                                <i className="fas fa-map-marker-alt"></i>
                                <span>{meetup.location}</span>
                            </div>
                        )}
                        <div className="meetup-participants">
                            <i className="fas fa-users"></i>
                            <span>
                                {meetup.currentParticipants || 0}
                                {meetup.maxParticipants && ` / ${meetup.maxParticipants}`} {t('meetups.participants')}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="meetup-actions">
                    <Link to={`/meetups/${meetupId}`} className="btn btn-outline">
                        {t('chat.backToMeetup')}
                    </Link>
                </div>
            </div>
            
            <div className="chat-container">
                {currentUser ? (
                    <EnhancedChat meetupId={parseInt(meetupId)} currentUser={currentUser} />
                ) : (
                    <div className="login-required">
                        <p>{t('chat.loginRequired')}</p>
                        <Link to="/login" className="btn btn-primary">
                            {t('common.login')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;