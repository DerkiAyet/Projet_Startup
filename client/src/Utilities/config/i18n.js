import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languageDetector from 'i18next-browser-languagedetector';
import translationEn from '../Languages/en.json';
import translationFr from '../Languages/fr.json';
import translationAr from '../Languages/ar.json'

const resources = {
    en: {
        translation: translationEn
    },
    fr: {
        translation: translationFr
    },
    ar: {
        translation: translationAr
    }
}

i18n.use(initReactI18next).use(languageDetector).init({
    resources,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    },
    detection: {
        order: ['cookie','querystring', 'localStorage', 'sessionStorage','htmlTag', 'navigator', 'path', 'subdomain'],
        caches: ['cookie'],
    }
});

export default i18n; 