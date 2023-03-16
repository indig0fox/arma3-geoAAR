import { defineStore } from 'pinia'

export const useRecordingDataStore = defineStore('dataStore', {
  state: () => {
    return {
      availableWorlds: new Map(),
      worldsLoaded: false,
      availableRecordings: new Map(),
      recordingsLoaded: false,
      activeWorld: null,
      activeRecording: null,
      activeRecordingData: null,
      activeRecordingReady: false,
      mapReady: false,
      apiUrl: 'http://127.0.0.1:5001',
      // apiUrl: window.location.origin,
      // apiUrl: 'http://127.0.0.1:9999',
      error: null,
      viewBounds: {},
      currentCenter: [0, 0],
      currentZoom: 0,
      currentPitch: 0,
      currentBearing: 0,
      mainMap: null,
      mousePositionXY: '00000 00000',
      mousePositionMGRS: '00000 00000',
      maplibreVersion: '',
      searchFilterOldest: '2017-06-01',
      searchFilterNewest: '2099-12-12',
      searchFilterTag: '',
      searchFilterMissionName: '',
      searchFilterWorld: '',
    }
  },
  getters: {
    mapHash (state) {
      if (!state.currentCenter) {
        return {}
      }
      return {
        z: state.currentZoom,
        cnt: state.currentCenter[0].toFixed(4) + ',' + state.currentCenter[1].toFixed(4),
        b: state.currentBearing,
        p: state.currentPitch
      }
    }
  },

  // could also be defined as
  // state: () => ({ count: 0 })
  actions: {
    async getWorlds () {
      let response, data
      try {
        response = await fetch('https://styles.ocap2.com/worlds.json', {})
        if (!response.ok) {
          return Promise.reject(response)
        }
      } catch (error) {
        // console.log('Error loading worlds data', error)
        return Promise.reject(error)
      }

      try {
        data = await response.json()
      } catch (error) {
        // console.log('Error parsing worlds data', error)
        return Promise.reject(error)
      }


      this.availableWorlds = new Map(Object.entries(data))
      // console.log('worlds', this.availableWorlds.size, this.availableWorlds)

      // load world previews async
      this.availableWorlds.forEach(async (value, key, map) => {
        var previewUri = 'https://styles.ocap2.com/previews/' + key + '_256px.png'
        fetch(previewUri, {
          method: 'GET',
        })
          .then((response) => {
            // console.log(response)

            if (!response.ok) {
              return Promise.reject(response)
            }
            value.preview = previewUri
            return Promise.resolve()

          })
          .catch((error) => {
            console.warn('Error loading preview for', value.worldName, error)
          })
      })

      return Promise.resolve(this.availableWorlds)
    },
    async getRecordings () {
      let response, data
      try {
        response = await fetch(this.apiUrl + `/api/v1/operations?tag=${this.searchFilterTag}&name=${this.searchFilterMissionName}&newer=${this.searchFilterOldest}&older=${this.searchFilterNewest}`, {
          // do not cache available recordings
          cache: "no-cache"
        })
        if (!response.ok) {
          return Promise.reject(response)
        }
      } catch (error) {
        // console.error('Error loading recordings', error)

        // reject with object containing both response and error
        return Promise.reject(error)
      }

      try {
        data = await response.json()
      } catch (error) {
        // console.error('Error parsing recordings')
        return Promise.reject(error)
      }


      const OpList = data;
      // console.log(OpList)
      // sort by newest first, using yyyy-mm-dd format in Date field
      OpList.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      // console.log('Success:', OpList);
      this.availableRecordings = new Map(
        OpList.map((item) => {
          return [item.id, item]
        })
      )
      return Promise.resolve(this.availableRecordings);
    },
    async getRecordingData (operation) {

      // if already loaded & matching then return
      if (this.activeRecordingData?.missionName === operation.mission_name) {
        return
      }
      this.activeRecordingData = {
        "missionName": "Loading...",
        "author": "",
      }
      const path = `/data/${operation.filename}`
      return fetch(this.apiUrl + path, {
      })
        .then((response) => {
          if (!response.status === 200) {
            return Promise.reject(response);
          }
          return Promise.resolve(response.json())
        })
        .then((data) => {
          const recordingData = data;
          console.log('Success: Retrieved recording data for', operation.filename);
          this.activeRecordingData = recordingData
          this.recordingUrl = this.apiUrl + path
          var recordingWorld = this.availableWorlds.get(operation.world_name.toLowerCase())
          // console.log('recordingWorld', recordingWorld)
          if (recordingWorld) {
            this.activeWorld = recordingWorld
          } else {
            this.activeWorld = null
            alert('World data not available for ' + operation.world_name)
          }

          // console.log('activeRecordingData', this.activeRecordingData)

          return Promise.resolve();
        })
        .catch((error) => {
          console.error("Error retrieving recording data for", operation.filename, error);
          return Promise.reject(error)
        });
    },
  }
});