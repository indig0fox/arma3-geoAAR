import { createApp } from 'vue'


import App from './App.vue'
import router from './router'

import '@/assets/main.css'
import '@/assets/playback.css'


// import "xp.css";
import "98.css";
// import "7.css"


const app = createApp(App)

import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

import i18n from '@/i18n'
app.use(i18n)

app.use(router)

app.mount('#app')