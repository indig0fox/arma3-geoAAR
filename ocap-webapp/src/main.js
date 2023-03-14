import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'
// import './assets/common.css'
// import './assets/index.css'

// import "xp.css";
import "98.css";
// import "7.css"

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

import { useRecordingDataStore } from './stores/recordings.js'


import i18n from '@/i18n'
app.use(i18n)

app.use(router)

useRecordingDataStore().getWorlds()
  .then((availableWorlds) => {
    console.log('Loaded', availableWorlds.size, 'worlds')
  })
  .catch((error) => {
    console.log('Error loading worlds data', error)
    return alert(`Error loading worlds\nStatus: ${error.status} ${error.statusText}\nUrl: ${error.url}`)
  })

useRecordingDataStore().getRecordings()
  .then((availableRecordings) => {
    console.log('Loaded', availableRecordings.size, 'recordings')
  })
  .then(() => {

  })
  .catch((error) => {
    console.log('Error loading recordings data', error)
    return alert(`Error loading recordings\nStatus: ${error.status} ${error.statusText}\nUrl: ${error.url}`)
  })

app.mount('#app')