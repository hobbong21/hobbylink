import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/auth';

class AuthService {
  async signUp(username, password, email) {
    try {
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        username,
        password,
        email
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Sign up failed' };
    }
  }

  async signIn(username, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/signin`, {
        username,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('idToken', response.data.idToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Sign in failed' };
    }
  }

  async validateToken(token) {
    try {
      const response = await axios.post(`${API_BASE_URL}/validate`, {
        token
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Token validation failed' };
    }
  }

  signOut() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    return Promise.resolve({ success: true });
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }
}

export default new AuthService();