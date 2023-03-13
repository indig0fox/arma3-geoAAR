import { createI18n } from 'vue-i18n'

// import
import en from './locales/en.json'
// import fr from './locales/fr.json'

// configure i18n
const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: { en },
});

export default i18n