import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/:catchAll(.*)",
      // route to worlds
      redirect: "/worlds",
    },
    {
      path: "/worlds",
      name: "worlds",
      component: () => import("../views/WorldsList.vue"),
    },
    {
      // path: "/world/:worldname",
      path: "/viewer",
      name: "worldViewer",
      component: () => import("../views/WorldViewer.vue"),
      props: true,
    },
    {
      path: "/recordings",
      name: "recordings",
      component: () => import("../views/RecordingsList.vue"),
    },
    {
      path: "/playback",
      name: "recordingViewer",
      component: () => import("../views/RecordingViewer.vue"),
      props: true,
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutPage.vue"),
    },
    {
      path: "/error",
      name: "error",
      component: () => import("../views/ErrorPage.vue"),
    }
  ],
});

import { useRecordingDataStore } from '@/stores/dataStore.js'

router.beforeEach(async (to, from) => {
  const recordingData = useRecordingDataStore()

  if (to.name === 'error' && recordingData.error) {
    return true
  }

  if (to.name === 'error' && !recordingData.error) {
    return { name: 'worlds' }
  }

  if (to.name === 'recordingViewer' && from.name === 'recordingViewer') {
    return true
  }

  if (to.name === 'recordingViewer' && from.name === 'recordingViewer') {
    return true
  }


  if (!recordingData.worldsLoaded || !recordingData.recordingsLoaded) {
    console.log('Loading worlds and recordings data')
    console.log(recordingData.worldsLoaded, recordingData.recordingsLoaded)

    try {
      await useRecordingDataStore()
        .getWorlds()
        .then((availableWorlds) => {
          console.log('Loaded', availableWorlds.size, 'worlds')
          // console.log('Worlds', availableWorlds)
          useRecordingDataStore().worldsLoaded = true
        })
        .catch((error) => {
          console.log('Error loading worlds data', error)
          // alert(
          //   `Error loading worlds\nStatus: ${error.status} ${error.statusText}\nUrl: ${error.url}`
          // )
          recordingData.error = {
            message: `Error loading worlds from API!`,
            raw: {
              message: '' + error,
              status: error.status,
              statusText: error.statusText,
              url: error.url
            }
          }
          throw error
        })

      await useRecordingDataStore().getRecordings()

        .then((availableRecordings) => {
          console.log('Loaded', availableRecordings.size, 'recordings')
          useRecordingDataStore().recordingsLoaded = true
        })
        .catch((e) => {
          recordingData.error = {
            message: `Error loading recordings from API!`,
            raw: {
              message: '' + error,
              status: error.status,
              statusText: error.statusText,
              url: error.url
            }
          }
          throw error
        })
    } catch (error) {
      // send to error page with props
      return { name: 'error' }
    }
  }

  if (to.query.world) {
    var worldObj = recordingData.availableWorlds.get(to.query.world.toLowerCase())

    if (worldObj) {
      recordingData.activeWorld = worldObj
      // console.log(this.activeWorld)
    }
  }

})

export default router;
