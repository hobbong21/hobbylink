import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchBar = ({ placeholder = "Search...", onResults, showAdvanced = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    type: '',
    category: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowAdvancedOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    setShowAdvancedOptions(false);

    try {
      let endpoint = '/api/search';
      let params = { q: searchQuery };

      if (showAdvanced && (advancedFilters.type || advancedFilters.category || advancedFilters.location)) {
        endpoint = '/api/search/advanced';
        params = {
          ...params,
          ...advancedFilters
        };
      }

      const response = await axios.get(endpoint, { params });
      
      if (onResults) {
        onResults(response.data);
      } else {
        // Navigate to search results page
        const searchParams = new URLSearchParams(params);
        navigate(`/search?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleAdvancedFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setAdvancedFilters({
      type: '',
      category: '',
      location: ''
    });
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => query.length > 2 && setShowSuggestions(true)}
        />
        
        <div className="search-buttons">
          {showAdvanced && (
            <button
              type="button"
              className={`advanced-toggle-btn ${showAdvancedOptions ? 'active' : ''}`}
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              title="Advanced Search"
            >
              ⚙️
            </button>
          )}
          
          <button
            type="button"
            className="search-btn"
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? '⏳' : '🔍'}
          </button>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-icon">🔍</span>
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Advanced Search Options */}
      {showAdvanced && showAdvancedOptions && (
        <div className="advanced-search-options">
          <div className="advanced-header">
            <h4>Advanced Search</h4>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
          
          <div className="advanced-filters">
            <div className="filter-group">
              <label>Type:</label>
              <select
                value={advancedFilters.type}
                onChange={(e) => handleAdvancedFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="studios">Studios</option>
                <option value="projects">Projects</option>
                <option value="meetups">Meetups</option>
                <option value="users">Users</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select
                value={advancedFilters.category}
                onChange={(e) => handleAdvancedFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Design">Design</option>
                <option value="Art">Art</option>
                <option value="Business">Business</option>
                <option value="Food">Food</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
                <option value="Education">Education</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Location:</label>
              <input
                type="text"
                placeholder="Enter location..."
                value={advancedFilters.location}
                onChange={(e) => handleAdvancedFilterChange('location', e.target.value)}
              />
            </div>
          </div>

          <div className="advanced-actions">
            <button
              className="btn btn-primary"
              onClick={() => handleSearch()}
              disabled={loading}
            >
              Search with Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;