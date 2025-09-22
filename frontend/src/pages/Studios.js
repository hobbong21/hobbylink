import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './StudioPage.css';

const Studios = () => {
  const { t } = useTranslation();
  const [studios, setStudios] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 모든 스튜디오 가져오기
        const response = await axios.get('/api/studios');
        setStudios(response.data);
        
        // 카테고리 추출
        const uniqueCategories = [...new Set(response.data
          .filter(studio => studio.category)
          .map(studio => studio.category))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching studios:', err);
        setError(t('common.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudios();
  }, [t]);

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredStudios = studios.filter(studio => {
    // 카테고리 필터링
    const categoryMatch = selectedCategory === 'all' || studio.category === selectedCategory;
    
    // 검색어 필터링
    const searchMatch = !searchQuery || 
      studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (studio.description && studio.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studios-header">
        <h1>{t('studios.title')}</h1>
        <p>창의적인 스튜디오를 발견하고 영감을 얻으세요</p>
      </div>

      <div className="studios-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('studios.search')}
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="category-filters">
          <button
            className={`category-filter ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            전체 카테고리
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredStudios.length > 0 ? (
        <div className="studios-grid">
          {filteredStudios.map(studio => (
            <div key={studio.id} className="studio-card">
              <div className="studio-card-cover">
                <img 
                  src={studio.coverImage || 'https://via.placeholder.com/400x300'} 
                  alt={studio.name}
                  onError={handleImageError}
                />
              </div>
              <div className="studio-card-content">
                <h3 className="studio-card-title">{studio.name}</h3>
                <p className="studio-card-description">
                  {studio.description?.substring(0, 100)}
                  {studio.description?.length > 100 ? '...' : ''}
                </p>
                <div className="studio-card-meta">
                  <div className="studio-card-creator">
                    <img 
                      src={studio.creator?.profileImageUrl || 'https://via.placeholder.com/30x30'} 
                      alt={studio.creator?.username}
                      className="creator-avatar-small"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/30x30'}
                    />
                    <span>{studio.creator?.username}</span>
                  </div>
                  {studio.category && (
                    <span className="studio-card-category">{studio.category}</span>
                  )}
                </div>
                <Link to={`/studios/${studio.id}`} className="btn btn-primary studio-card-link">
                  {t('studios.visitStudio')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>{t('studios.noStudios')}</p>
        </div>
      )}
    </div>
  );
};

export default Studios;