import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import AuthService from '../services/AuthService';
import './Header.css';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());
  }, [location]);

  const handleSignOut = async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    navigate('/');
    closeMobileMenu();
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="logo" onClick={closeMobileMenu}>
            <div className="logo-icon">
              <i className="fas fa-link"></i>
            </div>
            <span className="logo-text">HobbyLink</span>
          </Link>
          
          <div className="nav-content">
            <ul className={`nav-links ${isMobileMenuOpen ? 'nav-links-mobile-open' : ''}`}>
              <li>
                <Link 
                  to="/" 
                  className={isActive('/') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-home"></i>
                  <span>{t('nav.home')}</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/studios" 
                  className={isActive('/studios') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-palette"></i>
                  <span>{t('nav.studios')}</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects" 
                  className={isActive('/projects') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-project-diagram"></i>
                  <span>{t('nav.projects')}</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/meetups" 
                  className={isActive('/meetups') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-users"></i>
                  <span>{t('nav.meetups')}</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className={isActive('/profile') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-user"></i>
                  <span>{t('nav.profile')}</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className={isActive('/about') ? 'active' : ''}
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-info-circle"></i>
                  <span>{t('nav.about')}</span>
                </Link>
              </li>
            </ul>
            
            <div className="nav-actions">
              <NotificationBell />
              <LanguageSelector />
              {isAuthenticated ? (
                <button 
                  className="auth-button signout-button"
                  onClick={handleSignOut}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>{t('auth.signOut')}</span>
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="auth-button signin-button"
                  onClick={closeMobileMenu}
                >
                  <i className="fas fa-sign-in-alt"></i>
                  <span>{t('auth.signIn')}</span>
                </Link>
              )}
              <button 
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>
            </div>
          </div>
        </nav>
      </div>
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}
    </header>
  );
};

export default Header;