import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './StudioPage.css';

const StudioDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [studio, setStudio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudioData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 스튜디오 정보 가져오기
        const studioResponse = await axios.get(`/api/studios/${id}`);
        setStudio(studioResponse.data);
        
        // 스튜디오의 프로젝트 가져오기
        const projectsResponse = await axios.get(`/api/projects/studio/${id}`);
        setProjects(projectsResponse.data);
      } catch (err) {
        console.error('Error fetching studio data:', err);
        setError(t('common.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudioData();
  }, [id, t]);

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !studio) {
    return (
      <div className="container">
        <div className="error-message">
          <p>{error || t('common.studioNotFound')}</p>
          <Link to="/studios" className="btn btn-primary">
            {t('common.backToStudios')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-page">
      <div className="studio-header">
        <div className="studio-title-section">
          <h1 className="studio-title">{studio.name}</h1>
          <p className="studio-subtitle">{studio.tagline}</p>
          <div className="studio-meta">
            <div className="studio-meta-item">
              <i className="fas fa-user"></i>
              <span>{t('studioDetail.createdBy')} {studio.creator?.username}</span>
            </div>
            <div className="studio-meta-item">
              <i className="fas fa-calendar"></i>
              <span>{new Date(studio.createdAt).toLocaleDateString()}</span>
            </div>
            {studio.category && (
              <div className="studio-meta-item">
                <i className="fas fa-tag"></i>
                <span>{studio.category}</span>
              </div>
            )}
          </div>
        </div>
        <div className="studio-actions">
          <button className="btn btn-outline">
            <i className="far fa-bookmark"></i> 북마크
          </button>
          <button className="btn btn-primary">
            <i className="fas fa-share"></i> 공유
          </button>
        </div>
      </div>

      {studio.coverImage && (
        <div className="studio-cover">
          <img 
            src={studio.coverImage} 
            alt={studio.name} 
            onError={handleImageError}
          />
        </div>
      )}

      <div className="studio-content">
        <div className="studio-main">
          <div className="studio-description">
            <h2 className="studio-section-title">{t('studioDetail.about')}</h2>
            <p>{studio.description}</p>
          </div>

          <div className="studio-projects">
            <h2 className="studio-section-title">{t('studioDetail.projectsFromStudio')}</h2>
            {projects.length > 0 ? (
              <div className="project-grid">
                {projects.map(project => (
                  <div key={project.id} className="project-card">
                    {project.imageUrl && (
                      <img 
                        src={project.imageUrl} 
                        alt={project.title} 
                        className="project-image"
                        onError={handleImageError}
                      />
                    )}
                    <div className="project-info">
                      <h3 className="project-title">{project.title}</h3>
                      <p className="project-description">{project.description}</p>
                      {project.tags && (
                        <div className="project-tags">
                          {project.tags.split(',').map((tag, index) => (
                            <span key={index} className="project-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                      <Link to={`/projects/${project.id}`} className="project-link">
                        {t('home.viewProject')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>{t('studioDetail.noProjectsInStudio')}</p>
            )}
          </div>
        </div>

        <div className="studio-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">{t('studioDetail.creator')}</h3>
            <div className="creator-info">
              <img 
                src={studio.creator?.profileImageUrl || 'https://via.placeholder.com/60x60'} 
                alt={studio.creator?.username} 
                className="creator-avatar"
                onError={(e) => e.target.src = 'https://via.placeholder.com/60x60'}
              />
              <div>
                <div className="creator-name">{studio.creator?.username}</div>
                <div className="creator-role">{studio.creator?.title || t('studioDetail.designer')}</div>
              </div>
            </div>
            {studio.creator?.bio && (
              <p className="creator-bio">{studio.creator.bio}</p>
            )}
            <div className="creator-stats">
              <div className="stat-item">
                <div className="stat-value">{projects.length}</div>
                <div className="stat-label">{t('studioDetail.projects')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{studio.followers || 0}</div>
                <div className="stat-label">{t('studioDetail.followers')}</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{studio.likes || 0}</div>
                <div className="stat-label">{t('studioDetail.likes')}</div>
              </div>
            </div>
            <Link to={`/profile/${studio.creator?.id}`} className="btn btn-outline" style={{ width: '100%' }}>
              {t('studioDetail.viewProfile')}
            </Link>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">{t('studioDetail.studioInfo')}</h3>
            <ul className="studio-info-list">
              <li className="studio-info-item">
                <span className="info-label">{t('studioDetail.category')}</span>
                <span className="info-value">{studio.category || '-'}</span>
              </li>
              <li className="studio-info-item">
                <span className="info-label">{t('studioDetail.location')}</span>
                <span className="info-value">{studio.location || '-'}</span>
              </li>
              <li className="studio-info-item">
                <span className="info-label">{t('studioDetail.established')}</span>
                <span className="info-value">{new Date(studio.createdAt).getFullYear()}</span>
              </li>
              <li className="studio-info-item">
                <span className="info-label">{t('studioDetail.members')}</span>
                <span className="info-value">{studio.memberCount || 1}</span>
              </li>
            </ul>
          </div>

          {studio.tags && (
            <div className="sidebar-card">
              <h3 className="sidebar-title">{t('studioDetail.tags')}</h3>
              <div className="studio-tags">
                {studio.tags.split(',').map((tag, index) => (
                  <span key={index} className="studio-tag">{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioDetail;