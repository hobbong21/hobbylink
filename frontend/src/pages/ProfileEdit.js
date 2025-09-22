import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ImageUpload from '../components/ImageUpload';

const ProfileEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    bio: '',
    hobbies: '',
    interests: '',
    location: '',
    profileImage: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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
      const user = response.data;
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        gender: user.gender || '',
        bio: user.bio || '',
        hobbies: user.hobbies || '',
        interests: user.interests || '',
        location: user.location || '',
        profileImage: user.profileImage || ''
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      setError(t('common.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const userId = id || 1;
      await axios.put(`/api/users/${userId}`, formData);
      
      // Navigate back to profile page
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const userId = id || 1;
    navigate(`/profile/${userId}`);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/150x150?text=Profile';
  };

  const handleImageUploaded = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      profileImage: imageUrl
    }));
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

  return (
    <div className="container">
      <div className="profile-edit-container">
        <div className="profile-edit-header">
          <h1>{t('profile.editProfile')}</h1>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '2rem' }}>
            <p style={{ color: '#dc3545' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-edit-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">{t('profile.firstName')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">{t('profile.lastName')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="gender">{t('profile.gender')}</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Select gender</option>
                <option value="MALE">{t('profile.male')}</option>
                <option value="FEMALE">{t('profile.female')}</option>
                <option value="OTHER">{t('profile.other')}</option>
                <option value="PREFER_NOT_TO_SAY">{t('profile.preferNotToSay')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">{t('profile.location')}</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter your activity location"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Profile Image</h3>
            
            <ImageUpload
              currentImage={formData.profileImage}
              onImageUploaded={handleImageUploaded}
              category="profiles"
              placeholder="Upload Profile Image"
              className="profile-image-upload"
            />
            
            <div className="form-group">
              <label htmlFor="profileImage">Or enter image URL</label>
              <input
                type="url"
                id="profileImage"
                name="profileImage"
                value={formData.profileImage}
                onChange={handleInputChange}
                placeholder="Enter image URL (optional)"
              />
              <small className="form-help">
                You can upload an image above or enter a URL here
              </small>
            </div>
          </div>

          <div className="form-section">
            <h3>About You</h3>
            
            <div className="form-group">
              <label htmlFor="bio">{t('profile.bio')}</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="hobbies">{t('profile.hobbies')}</label>
              <input
                type="text"
                id="hobbies"
                name="hobbies"
                value={formData.hobbies}
                onChange={handleInputChange}
                placeholder="Enter your hobbies (separated by commas)"
              />
              <small className="form-help">
                Separate multiple hobbies with commas (e.g., "Photography, Hiking, Cooking")
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="interests">{t('profile.interests')}</label>
              <input
                type="text"
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleInputChange}
                placeholder="Enter your interests (separated by commas)"
              />
              <small className="form-help">
                Separate multiple interests with commas (e.g., "Technology, Art, Music")
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : t('profile.saveChanges')}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              {t('profile.cancelChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;