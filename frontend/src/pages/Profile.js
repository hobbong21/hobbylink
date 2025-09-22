import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Profile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For demo purposes, we'll use a default user ID if none provided
      const userId = id || 1;
      const response = await axios.get(`/api/users/${userId}`);
      setUser(response.data);
      
      // For demo purposes, assume it's always the user's own profile
      setIsOwnProfile(true);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError(t('common.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const getGenderDisplay = (gender) => {
    if (!gender) return '';
    switch (gender) {
      case 'MALE':
        return t('profile.male');
      case 'FEMALE':
        return t('profile.female');
      case 'OTHER':
        return t('profile.other');
      case 'PREFER_NOT_TO_SAY':
        return t('profile.preferNotToSay');
      default:
        return gender;
    }
  };

  const getFullName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    }
    return user.username;
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/200x200?text=Profile';
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
          <button onClick={fetchUser} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-container">
        <div className="profile-header">
          <h1>{t('profile.title')}</h1>
          {isOwnProfile && (
            <Link to={`/profile/${user.id}/edit`} className="btn btn-primary">
              {t('profile.editProfile')}
            </Link>
          )}
        </div>

        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="profile-image-section">
              <img
                src={user.profileImage || 'https://via.placeholder.com/200x200?text=Profile'}
                alt={`${user.username}'s profile`}
                className="profile-image"
                onError={handleImageError}
              />
              <h2>{getFullName(user)}</h2>
              <p className="username">@{user.username}</p>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">{t('profile.rating')}</span>
                <div className="rating-display">
                  <span className="rating-value">
                    {user.averageRating ? user.averageRating.toFixed(1) : '0.0'}
                  </span>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${star <= (user.averageRating || 0) ? 'filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="rating-count">
                    ({user.totalRatings || 0} reviews)
                  </span>
                </div>
              </div>

              <div className="stat-item">
                <span className="stat-label">{t('profile.reputation')}</span>
                <div className="reputation-score">
                  <span className="score-value">{user.reputationScore || 100}</span>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ width: `${Math.min((user.reputationScore || 100) / 150 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-main">
            <div className="profile-section">
              <h3>Basic Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>{t('profile.name')}</label>
                  <p>{getFullName(user)}</p>
                </div>

                {user.gender && (
                  <div className="info-item">
                    <label>{t('profile.gender')}</label>
                    <p>{getGenderDisplay(user.gender)}</p>
                  </div>
                )}

                {user.location && (
                  <div className="info-item">
                    <label>{t('profile.location')}</label>
                    <p>📍 {user.location}</p>
                  </div>
                )}

                <div className="info-item">
                  <label>Email:</label>
                  <p>{user.email}</p>
                </div>
              </div>
            </div>

            {user.bio && (
              <div className="profile-section">
                <h3>{t('profile.bio')}</h3>
                <div className="bio-content">
                  <p>{user.bio}</p>
                </div>
              </div>
            )}

            {user.hobbies && (
              <div className="profile-section">
                <h3>{t('profile.hobbies')}</h3>
                <div className="tags">
                  {user.hobbies.split(',').map((hobby, index) => (
                    <span key={index} className="tag">{hobby.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {user.interests && (
              <div className="profile-section">
                <h3>{t('profile.interests')}</h3>
                <div className="tags">
                  {user.interests.split(',').map((interest, index) => (
                    <span key={index} className="tag">{interest.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-section">
              <h3>{t('profile.socialLogin')}</h3>
              <div className="social-connections">
                <div className={`social-item ${user.kakaoId ? 'connected' : 'disconnected'}`}>
                  <span className="social-icon">💬</span>
                  <span className="social-name">KakaoTalk</span>
                  <span className="social-status">
                    {user.kakaoId ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className={`social-item ${user.naverId ? 'connected' : 'disconnected'}`}>
                  <span className="social-icon">🟢</span>
                  <span className="social-name">Naver</span>
                  <span className="social-status">
                    {user.naverId ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className={`social-item ${user.googleId ? 'connected' : 'disconnected'}`}>
                  <span className="social-icon">🔍</span>
                  <span className="social-name">Google</span>
                  <span className="social-status">
                    {user.googleId ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;