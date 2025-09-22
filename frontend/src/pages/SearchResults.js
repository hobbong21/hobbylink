import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SearchBar from '../components/SearchBar';

const SearchResults = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const locationParam = searchParams.get('location');

    if (query || type || category || locationParam) {
      performSearch(query, type, category, locationParam);
    }
  }, [location.search]);

  const performSearch = async (query, type, category, locationParam) => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '/api/search';
      let params = {};

      if (query) params.q = query;
      if (type) params.type = type;
      if (category) params.category = category;
      if (locationParam) params.location = locationParam;

      if (type || category || locationParam) {
        endpoint = '/api/search/advanced';
      }

      const response = await axios.get(endpoint, { params });
      setResults(response.data);
      
      // Set active tab based on results
      if (type) {
        setActiveTab(type);
      } else {
        setActiveTab('all');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = (newResults) => {
    setResults(newResults);
    setActiveTab('all');
  };

  const getTotalResults = () => {
    return Object.values(results).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  };

  const getTabCount = (tabType) => {
    const items = results[tabType];
    return Array.isArray(items) ? items.length : 0;
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
  };

  const renderStudioResults = () => {
    const studios = results.studios || [];
    if (studios.length === 0) return null;

    return (
      <div className="search-results-section">
        <h3>Studios ({studios.length})</h3>
        <div className="grid">
          {studios.map(studio => (
            <div key={studio.id} className="card">
              <h4>{studio.name}</h4>
              <p>{studio.description?.substring(0, 150)}...</p>
              <div className="result-meta">
                <span className="category-tag">{studio.category}</span>
                <span className="creator">by {studio.creator?.username}</span>
              </div>
              <Link to={`/studios/${studio.id}`} className="btn btn-primary">
                View Studio
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjectResults = () => {
    const projects = results.projects || [];
    if (projects.length === 0) return null;

    return (
      <div className="search-results-section">
        <h3>Projects ({projects.length})</h3>
        <div className="grid">
          {projects.map(project => (
            <div key={project.id} className="card">
              {project.imageUrl && (
                <img 
                  src={project.imageUrl} 
                  alt={project.title}
                  className="project-image"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <h4>{project.title}</h4>
              <p>{project.description?.substring(0, 150)}...</p>
              <div className="result-meta">
                <span className="creator">by {project.user?.username}</span>
                {project.studio && (
                  <span className="studio">in {project.studio.name}</span>
                )}
              </div>
              {project.tags && (
                <div className="tags">
                  {project.tags.split(',').map((tag, index) => (
                    <span key={index} className="tag">{tag.trim()}</span>
                  ))}
                </div>
              )}
              <Link to={`/projects/${project.id}`} className="btn btn-primary">
                View Project
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMeetupResults = () => {
    const meetups = results.meetups || [];
    if (meetups.length === 0) return null;

    return (
      <div className="search-results-section">
        <h3>Meetups ({meetups.length})</h3>
        <div className="grid">
          {meetups.map(meetup => (
            <div key={meetup.id} className="card meetup-card">
              <div className="meetup-header">
                <div className="meetup-badges">
                  {meetup.type === 'SPONTANEOUS' && (
                    <span className="spontaneous-badge">Spontaneous</span>
                  )}
                </div>
              </div>
              <h4>{meetup.title}</h4>
              <p>{meetup.description?.substring(0, 150)}...</p>
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
                  {meetup.maxParticipants && ` / ${meetup.maxParticipants}`} participants
                </div>
              </div>
              {meetup.category && (
                <span className="category-tag">{meetup.category}</span>
              )}
              <Link to={`/meetups/${meetup.id}`} className="btn btn-primary">
                View Meetup
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUserResults = () => {
    const users = results.users || [];
    if (users.length === 0) return null;

    return (
      <div className="search-results-section">
        <h3>Users ({users.length})</h3>
        <div className="grid">
          {users.map(user => (
            <div key={user.id} className="card user-card">
              <div className="user-info">
                <img
                  src={user.profileImage || 'https://via.placeholder.com/80x80?text=User'}
                  alt={`${user.username}'s profile`}
                  className="user-avatar"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/80x80?text=User'}
                />
                <div className="user-details">
                  <h4>{user.firstName && user.lastName ? 
                    `${user.firstName} ${user.lastName}` : user.username}</h4>
                  <p className="username">@{user.username}</p>
                  {user.location && (
                    <p className="location">📍 {user.location}</p>
                  )}
                  {user.bio && (
                    <p className="bio">{user.bio.substring(0, 100)}...</p>
                  )}
                </div>
              </div>
              <div className="user-stats">
                {user.averageRating && (
                  <span className="rating">⭐ {user.averageRating.toFixed(1)}</span>
                )}
                {user.reputationScore && (
                  <span className="reputation">🏆 {user.reputationScore}</span>
                )}
              </div>
              <Link to={`/profile/${user.id}`} className="btn btn-primary">
                View Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="search-page-header">
          <SearchBar onResults={handleNewSearch} showAdvanced={true} />
        </div>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="loading-spinner">
            <p>Searching...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="search-page-header">
          <SearchBar onResults={handleNewSearch} showAdvanced={true} />
        </div>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="error-message">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalResults = getTotalResults();

  return (
    <div className="container">
      <div className="search-page-header">
        <SearchBar onResults={handleNewSearch} showAdvanced={true} />
        <div className="search-summary">
          <p>Found {totalResults} results</p>
        </div>
      </div>

      {totalResults > 0 && (
        <>
          <div className="search-tabs">
            <button 
              className={`search-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({totalResults})
            </button>
            {results.studios && results.studios.length > 0 && (
              <button 
                className={`search-tab ${activeTab === 'studios' ? 'active' : ''}`}
                onClick={() => setActiveTab('studios')}
              >
                Studios ({getTabCount('studios')})
              </button>
            )}
            {results.projects && results.projects.length > 0 && (
              <button 
                className={`search-tab ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                Projects ({getTabCount('projects')})
              </button>
            )}
            {results.meetups && results.meetups.length > 0 && (
              <button 
                className={`search-tab ${activeTab === 'meetups' ? 'active' : ''}`}
                onClick={() => setActiveTab('meetups')}
              >
                Meetups ({getTabCount('meetups')})
              </button>
            )}
            {results.users && results.users.length > 0 && (
              <button 
                className={`search-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users ({getTabCount('users')})
              </button>
            )}
          </div>

          <div className="search-results">
            {activeTab === 'all' && (
              <>
                {renderStudioResults()}
                {renderProjectResults()}
                {renderMeetupResults()}
                {renderUserResults()}
              </>
            )}
            {activeTab === 'studios' && renderStudioResults()}
            {activeTab === 'projects' && renderProjectResults()}
            {activeTab === 'meetups' && renderMeetupResults()}
            {activeTab === 'users' && renderUserResults()}
          </div>
        </>
      )}

      {totalResults === 0 && (
        <div className="no-results">
          <div className="no-results-content">
            <h2>No results found</h2>
            <p>Try adjusting your search terms or filters</p>
            <div className="search-suggestions">
              <h3>Search suggestions:</h3>
              <ul>
                <li>Check your spelling</li>
                <li>Try more general keywords</li>
                <li>Use fewer filters</li>
                <li>Browse categories instead</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;