import axios from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL || 'https://web-production-cafaa.up.railway.app';

const api = axios.create({
  baseURL: API_URL
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('dl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
export { API_URL };

// Helper to get correct avatar URL (handles both local and Google avatars)
export function getAvatarUrl(avatar) {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${API_URL}${avatar}`;
}
