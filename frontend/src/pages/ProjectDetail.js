import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ProjectPage.css';

const ProjectDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/projects/${id}`);
        setProject(response.data);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(t('common.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id, t]);

  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/800x450?text=No+Image';
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

  if (error || !project) {
    return (
      <div className="container">
        <div className="error-message">
          <p>{error || t('common.projectNotFound')}</p>
          <Link to="/projects" className="btn btn-primary">
            {t('projectDetail.backToProjects')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="project-page">
      <div className="project-header">
        <div className="project-title-section">
          <h1 className="project-title">{project.title}</h1>
          <div className="project-meta">
            <div className="project-meta-item">
              <i className="fas fa-user"></i>
              <span>{t('projectDetail.createdBy')} {project.user?.username}</span>
            </div>
            {project.studio && (
              <div className="project-meta-item">
                <i className="fas fa-building"></i>
                <span>{t('projectDetail.studio')} {project.studio.name}</span>
              </div>
            )}
            <div className="project-meta-item">
              <i className="fas fa-calendar"></i>
              <span>{t('projectDetail.created')} {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="project-actions">
          {project.projectUrl && (
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <i className="fas fa-external-link-alt"></i> {t('projectDetail.viewLiveProject')}
            </a>
          )}
          <button className="btn btn-outline">
            <i className="far fa-bookmark"></i> 북마크
          </button>
        </div>
      </div>

      <div className="project-showcase">
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={project.title} 
            className="project-main-image"
            onError={handleImageError}
          />
        ) : (
          <div className="project-image-placeholder">
            <i className="fas fa-image"></i>
            <p>No image available</p>
          </div>
        )}
      </div>

      <div className="project-content">
        <div className="project-main">
          <div className="project-description">
            <h2 className="project-section-title">{t('projectDetail.about')}</h2>
            <p>{project.description}</p>
          </div>

          {project.tags && (
            <div className="project-tags-section">
              <h2 className="project-section-title">{t('projectDetail.technologies')}</h2>
              <div className="project-tags">
                {project.tags.split(',').map((tag, index) => (
                  <span key={index} className="project-tag">{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* 추가 프로젝트 섹션들을 여기에 추가할 수 있습니다 */}
        </div>

        <div className="project-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">{t('projectDetail.creator')}</h3>
            <div className="creator-info">
              <img 
                src={project.user?.profileImageUrl || 'https://via.placeholder.com/60x60'} 
                alt={project.user?.username} 
                className="creator-avatar"
                onError={(e) => e.target.src = 'https://via.placeholder.com/60x60'}
              />
              <div>
                <div className="creator-name">{project.user?.username}</div>
                <div className="creator-role">{project.user?.title || t('projectDetail.designer')}</div>
              </div>
            </div>
            {project.user?.bio && (
              <p className="creator-bio">{project.user.bio}</p>
            )}
            <Link to={`/profile/${project.user?.id}`} className="btn btn-outline" style={{ width: '100%' }}>
              {t('projectDetail.viewProfile')}
            </Link>
          </div>

          {project.studio && (
            <div className="sidebar-card">
              <h3 className="sidebar-title">{t('projectDetail.studio')}</h3>
              <div className="studio-info">
                <img 
                  src={project.studio.coverImage || 'https://via.placeholder.com/60x60'} 
                  alt={project.studio.name} 
                  className="studio-avatar"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/60x60'}
                />
                <div>
                  <div className="studio-name">{project.studio.name}</div>
                  {project.studio.category && (
                    <div className="studio-category">{project.studio.category}</div>
                  )}
                </div>
              </div>
              <Link to={`/studios/${project.studio.id}`} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>
                {t('projectDetail.visitStudio')}
              </Link>
            </div>
          )}

          <div className="sidebar-card">
            <h3 className="sidebar-title">{t('projectDetail.projectInfo')}</h3>
            <ul className="project-info-list">
              <li className="project-info-item">
                <span className="info-label">{t('projectDetail.created')}</span>
                <span className="info-value">{new Date(project.createdAt).toLocaleDateString()}</span>
              </li>
              <li className="project-info-item">
                <span className="info-label">{t('projectDetail.lastUpdated')}</span>
                <span className="info-value">{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</span>
              </li>
              <li className="project-info-item">
                <span className="info-label">{t('projectDetail.views')}</span>
                <span className="info-value">{project.views || 0}</span>
              </li>
              <li className="project-info-item">
                <span className="info-label">{t('projectDetail.likes')}</span>
                <span className="info-value">{project.likes || 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="project-navigation">
        <Link to="/projects" className="btn btn-outline">
          <i className="fas fa-arrow-left"></i> {t('projectDetail.backToProjects')}
        </Link>
      </div>
    </div>
  );
};

export default ProjectDetail;