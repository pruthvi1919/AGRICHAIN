// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// load JSON files (you already have en.json and hi.json in public or src/locales)
import en from "./i18n/translations/en.json";
import hi from "./i18n/translations/hi.json";
import kn from "./i18n/translations/kn.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn }
    },
    fallbackLng: "en",
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      // tweak detection if needed
      order: ["localStorage", "navigator", "querystring", "cookie"],
      caches: ["localStorage"],
    },
  });

export default i18n;
