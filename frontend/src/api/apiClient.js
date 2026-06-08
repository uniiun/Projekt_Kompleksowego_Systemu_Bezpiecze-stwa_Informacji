import axios from 'axios';

// Dynamiczne pobieranie adresu IP / hosta serwera
const getBaseURL = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api/`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response && error.response.status === 403) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest = requestUrl.includes('/auth/login/') || requestUrl.includes('/auth/verify-totp/') || requestUrl.includes('/auth/webauthn/');
      const skipForbiddenRedirect = error.config?.skipForbiddenRedirect === true;

      // Osobna obsluga wygasnietego hasla
      const code = error.response?.data?.code;
      if (code === 'PASSWORD_EXPIRED') {
        if (window.location.pathname !== '/profile') {
          window.location.href = '/profile?expired=true';
        }
        return Promise.reject(error);
      }

      if (window.location.pathname !== '/forbidden') {
        if (!isAuthRequest && !skipForbiddenRedirect) {
          window.location.href = '/forbidden';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
