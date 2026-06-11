import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minut
const CHECK_INTERVAL = 5000; // Sprawdzanie co 5 sekund

const InactivityTimeout = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    // Ustawienie początkowej aktywności
    localStorage.setItem('last_activity_time', Date.now().toString());

    const updateActivity = () => {
      localStorage.setItem('last_activity_time', Date.now().toString());
    };

    // Nasłuchiwanie zdarzeń wskazujących na aktywność użytkownika
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Cykliczne sprawdzanie czasu bezczynności
    const intervalId = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('last_activity_time') || '0', 10);
      if (lastActivity && Date.now() - lastActivity > INACTIVITY_LIMIT) {
        localStorage.removeItem('last_activity_time');
        logout();
        navigate('/login?timeout=true');
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(intervalId);
    };
  }, [token, logout, navigate]);

  return null;
};

export default InactivityTimeout;
