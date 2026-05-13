import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import './ThemePicker.css';

const ACCENT_COLORS = [
  { name: 'Purple', value: '#7c6af7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Yellow', value: '#eab308' },
];

export default function ThemePicker({ onClose }) {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { lang, setLang, t, languages } = useLang();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="theme-picker" onClick={e => e.stopPropagation()}>
        <div className="theme-picker-header">
          <h2>🎨 {t('theme')} & {t('language')}</h2>
          <button onClick={onClose} className="ai-close">✕</button>
        </div>

        {/* Dark/Light */}
        <div className="theme-section">
          <label className="theme-section-label">Mode</label>
          <div className="theme-mode-btns">
            <button className={`theme-mode-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
              🌙 Dark
            </button>
            <button className={`theme-mode-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
              ☀️ Light
            </button>
          </div>
        </div>

        {/* Accent color */}
        <div className="theme-section">
          <label className="theme-section-label">{t('accentColor')}</label>
          <div className="accent-colors">
            {ACCENT_COLORS.map(color => (
              <button
                key={color.value}
                className={`accent-btn ${accentColor === color.value ? 'active' : ''}`}
                style={{ background: color.value }}
                onClick={() => setAccentColor(color.value)}
                title={color.name}
                aria-label={color.name}
              />
            ))}
          </div>
          {/* Preview */}
          <div className="accent-preview" style={{ background: accentColor }}>
            {t('accentColor')}: {accentColor}
          </div>
        </div>

        {/* Language */}
        <div className="theme-section">
          <label className="theme-section-label">{t('language')}</label>
          <div className="lang-grid">
            {languages.map(l => (
              <button
                key={l.code}
                className={`lang-btn ${lang === l.code ? 'active' : ''}`}
                onClick={() => setLang(l.code)}
              >
                <span className="lang-flag">{l.flag}</span>
                <span className="lang-name">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
