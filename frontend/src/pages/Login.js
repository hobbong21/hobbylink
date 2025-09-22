import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthService from '../services/AuthService';
import './Login.css';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const result = await AuthService.signUp(formData.username, formData.password, formData.email);
        if (result.success) {
          alert(t('auth.signupSuccess'));
          setIsSignUp(false);
        }
      } else {
        const result = await AuthService.signIn(formData.username, formData.password);
        if (result.success) {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isSignUp ? t('auth.signUp') : t('auth.signIn')}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder={t('auth.username')}
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {isSignUp && (
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder={t('auth.password')}
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? t('auth.loading') : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
          </button>
        </form>
        
        <div className="auth-switch">
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="switch-button"
          >
            {isSignUp ? t('auth.haveAccount') : t('auth.needAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;