import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { register } from './serviceWorkerRegistration';

// Handle Google OAuth token BEFORE React renders
// URL format: https://discord-lite-client.vercel.app/?google_token=xxx#/
const urlParams = new URLSearchParams(window.location.search);
const googleToken = urlParams.get('google_token');
if (googleToken) {
  localStorage.setItem('dl_token', googleToken);
  // Clean URL and redirect to home
  window.location.replace('/#/');
} else {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
  register();
}
