import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Capture the install prompt event
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setVisible(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setInstalled(true);
    }
    setPrompt(null);
  };

  if (installed || !visible) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-icon">⚡</div>
      <div className="install-prompt-text">
        <strong>Install Discord Lite</strong>
        <span>Add to home screen for the best experience</span>
      </div>
      <div className="install-prompt-actions">
        <button className="install-btn" onClick={handleInstall}>Install</button>
        <button className="dismiss-btn" onClick={() => setVisible(false)}>✕</button>
      </div>
    </div>
  );
}
