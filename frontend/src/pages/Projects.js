import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ProjectPage.css';

const Projects = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 모든 프로젝트 가져오기
        const response = await axios.get('/api/projects');
        setProjects(response.data);
        
        // 태그에서 카테고리 추출
        const allTags = response.data
          .filter(project => project.tags)
          .flatMap(project => project.tags.split(',').map(tag => tag.trim()));
        const uniqueCategories = [...new Set(allTags)];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(t('common.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
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

  const filteredProjects = projects.filter(project => {
    // 카테고리 필터링
    const categoryMatch = selectedCategory === 'all' || 
      (project.tags && project.tags.split(',').map(tag => tag.trim()).includes(selectedCategory));
    
    // 검색어 필터링
    const searchMatch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
    <div className="projects-page">
      <div className="projects-header">
        <h1>{t('projects.title')}</h1>
        <p>{t('projects.subtitle')}</p>
      </div>

      <div className="projects-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('projects.search')}
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
            {t('projects.allCategories')}
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

      {filteredProjects.length > 0 ? (
        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-image">
                <img 
                  src={project.imageUrl || 'https://via.placeholder.com/400x300'} 
                  alt={project.title}
                  onError={handleImageError}
                />
              </div>
              <div className="project-card-content">
                <h3 className="project-card-title">{project.title}</h3>
                <p className="project-card-description">
                  {project.description?.substring(0, 100)}
                  {project.description?.length > 100 ? '...' : ''}
                </p>
                {project.tags && (
                  <div className="project-card-tags">
                    {project.tags.split(',').slice(0, 3).map((tag, index) => (
                      <span key={index} className="project-card-tag">{tag.trim()}</span>
                    ))}
                    {project.tags.split(',').length > 3 && (
                      <span className="project-card-tag">+{project.tags.split(',').length - 3}</span>
                    )}
                  </div>
                )}
                <div className="project-card-meta">
                  <div className="project-card-creator">
                    <img 
                      src={project.user?.profileImageUrl || 'https://via.placeholder.com/30x30'} 
                      alt={project.user?.username}
                      className="creator-avatar-small"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/30x30'}
                    />
                    <span>{project.user?.username}</span>
                  </div>
                  {project.studio && (
                    <span className="project-card-studio">{project.studio.name}</span>
                  )}
                </div>
                <div className="project-card-actions">
                  <Link to={`/projects/${project.id}`} className="btn btn-primary">
                    {t('projects.viewProject')}
                  </Link>
                  {project.projectUrl && (
                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                      {t('projects.liveDemo')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>{t('projects.noProjects')}</p>
        </div>
      )}
    </div>
  );
};

export default Projects;