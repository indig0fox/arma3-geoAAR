import { defineStore } from 'pinia'

export const useRecordingDataStore = defineStore('recordingData', {
  state: () => {
    return {
      availableWorlds: [],
      availableRecordings: [],
      activeWorld: { worldName: 'tanoa', displayName: 'Tanoa' },
      activeRecording: {},
      recordingUrl: '',
      recordingMetadata: {},
      viewBounds: {},
      currentZoom: 0,
      currentPitch: 0,
      currentBearing: 0,
      playbackMap: null,
      mousePositionXY: '0000, 0000',
      mousePositionMGRS: '0000 0000',
      maplibreVersion: '',
      searchFilterOldest: '2017-06-01',
      searchFilterNewest: '2099-12-12',
      searchFilterTag: '',
      searchFilterMissionName: '',
      searchFilterWorld: '',
    }
  },
  // could also be defined as
  // state: () => ({ count: 0 })
  actions: {
    async getWorlds () {
      fetch('https://styles.ocap2.com/worlds.json')
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          var worlds = []
          Object.keys(data.worlds).forEach(function (key) {
            var item = data.worlds[key]
            var previewUri = 'https://styles.ocap2.com/previews/' + key + '_256px.png'
            fetch(previewUri)
              .then((response) => {
                if (response.ok) {
                  item.preview = previewUri
                }
                worlds.push(data.worlds[key])
              })
              .catch((error) => {
                console.error(error)
              })
          })
          this.availableWorlds = worlds
        })
    },
    getRecordings () {
      const uri = 'http://127.0.0.1:5001'
      // const uri = window.location.origin
      return fetch(uri + `/api/v1/operations?tag=${this.searchFilterTag}&name=${this.searchFilterMissionName}&newer=${this.searchFilterOldest}&older=${this.searchFilterNewest}`, {
        cache: "no-cache"
      })
        .then((response) => {
          if (!response.status === 200) {
            return Promise.reject(response);
          }
          return Promise.resolve(response.json())
        })
        .then((data) => {
          const OpList = data;
          // sort by newest first, using yyyy-mm-dd format in Date field
          OpList.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
          // console.log('Success:', OpList);
          this.availableRecordings = OpList
          return Promise.resolve();
        })
        .catch((error) => {
          // console.error('Error:', error);
          this.availableRecordings = [
            {
              "id": 0,
              "name": "Error",
              "date": "2021-01-01",
              "tag": "Error",
              "mission_name": "Failed to get data from server",
            }
          ]
          return
        });

    },
    getRecordingData (operation) {
      const uri = 'http://127.0.0.1:5001'
      // const uri = window.location.origin
      const path = `/data/${operation.filename}`
      return fetch(uri + path, {
        cache: "no-cache"
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
          this.activeRecording = recordingData
          this.recordingUrl = uri + path
          var recordingWorld = this.availableWorlds.find(world => world.meta.worldName.toLowerCase() === operation.world_name.toLowerCase())
          console.log('recordingWorld', recordingWorld)
          if (recordingWorld) {
            this.activeWorld = recordingWorld.meta
          } else {
            this.activeWorld = { worldName: 'vr', displayName: 'VR' }
          }

          return Promise.resolve();
        })
        .catch((error) => {
          console.error("Error retrieving recording data for", filename, error);
          return
        });
    },
  }
});