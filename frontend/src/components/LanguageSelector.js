import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language || 'en';
  const isKorean = currentLanguage.startsWith('ko');
  const isEnglish = currentLanguage.startsWith('en') || (!isKorean && currentLanguage !== 'ko');

  return (
    <div className="language-selector" role="group" aria-label={t('nav.language')}>
      <span className="language-label">{t('nav.language')}: </span>
      <button
        className={`language-btn ${isKorean ? 'active' : ''}`}
        onClick={() => changeLanguage('ko')}
        aria-pressed={isKorean}
        aria-label="한국어로 변경"
      >
        한국어
      </button>
      <button
        className={`language-btn ${isEnglish ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        aria-pressed={isEnglish}
        aria-label="Change to English"
      >
        English
      </button>
    </div>
  );
};

export default LanguageSelector;