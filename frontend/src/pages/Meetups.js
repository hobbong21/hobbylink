import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Meetups = () => {
  const { t } = useTranslation();
  const [meetups, setMeetups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMeetups, setFilteredMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMeetups();
  }, [activeTab]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = meetups.filter(meetup =>
        meetup.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meetup.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meetup.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMeetups(filtered);
    } else {
      setFilteredMeetups(meetups);
    }
  }, [searchTerm, meetups]);

  const fetchMeetups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = '/api/meetups';
      if (activeTab === 'active') {
        endpoint = '/api/meetups/active';
      } else if (activeTab === 'spontaneous') {
        endpoint = '/api/meetups/spontaneous';
      }
      
      const response = await axios.get(endpoint);
      setMeetups(response.data);
    } catch (error) {
      console.error('Error fetching meetups:', error);
      setError(t('common.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x300?text=Meetup';
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  const getTimeUntilMeetup = (dateTime) => {
    const now = new Date();
    const meetupTime = new Date(dateTime);
    const diffInHours = Math.ceil((meetupTime - now) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Starting soon!';
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.ceil(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="loading-spinner">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="error-message">
          <p style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</p>
          <button onClick={fetchMeetups} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>{t('meetups.title')}</h1>
        <Link to="/meetups/create" className="btn btn-primary">
          {t('meetups.createMeetup')}
        </Link>
      </div>
      
      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '2rem' }}>
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Meetups
        </button>
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button 
          className={`tab-btn ${activeTab === 'spontaneous' ? 'active' : ''}`}
          onClick={() => setActiveTab('spontaneous')}
        >
          {t('meetups.spontaneous')}
        </button>
      </div>
      
      <div className="form-group">
        <input
          type="text"
          placeholder={t('meetups.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid">
        {filteredMeetups.map(meetup => (
          <div key={meetup.id} className="card meetup-card">
            <div className="meetup-header">
              <div className="meetup-time-badge">
                {getTimeUntilMeetup(meetup.meetupDateTime)}
              </div>
              {meetup.type === 'SPONTANEOUS' && (
                <div className="spontaneous-badge">
                  {t('meetups.spontaneous')}
                </div>
              )}
            </div>
            
            <h3>{meetup.title}</h3>
            <p>{meetup.description?.substring(0, 100)}{meetup.description?.length > 100 ? '...' : ''}</p>
            
            <div className="meetup-info">
              <div className="meetup-datetime">
                📅 {formatDateTime(meetup.meetupDateTime)}
              </div>
              {meetup.location && (
                <div className="meetup-location">
                  📍 {meetup.location}
                </div>
              )}
              <div className="meetup-participants">
                👥 {meetup.currentParticipants || 0}
                {meetup.maxParticipants && ` / ${meetup.maxParticipants}`} {t('meetups.participants')}
              </div>
            </div>
            
            {meetup.category && (
              <span className="tag">{meetup.category}</span>
            )}
            
            <div style={{ marginTop: '1rem' }}>
              <Link to={`/meetups/${meetup.id}`} className="btn btn-primary">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredMeetups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>{t('meetups.noMeetups')}</p>
        </div>
      )}
    </div>
  );
};

export default Meetups;