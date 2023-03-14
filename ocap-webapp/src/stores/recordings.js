import { defineStore } from 'pinia'

export const useRecordingDataStore = defineStore('recordingData', {
  state: () => {
    return {
      availableWorlds: new Map(),
      availableRecordings: new Map(),
      activeWorld: null,
      activeRecording: null,
      activeRecordingData: null,
      recordingUrl: '',
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
      return fetch('https://styles.ocap2.com/worlds.json', {
        cache: "no-cache"
      })
        .then((response) => {
          if (!response.ok) {
            return Promise.reject(response)
          }
          return Promise.resolve(response.json())
        })
        .then((data) => {
          this.availableWorlds = new Map(Object.entries(data.worlds))
          // console.log('worlds', this.availableWorlds.size, this.availableWorlds)

          this.availableWorlds.forEach(async (value, key, map) => {
            var previewUri = 'https://styles.ocap2.com/previews/' + key + '_256px.png'
            return fetch(previewUri, { method: 'GET' })
              .then((response) => {
                // console.log(response)

                if (!response.ok) {
                  return Promise.reject(response)
                }
                value.preview = previewUri
                return Promise.resolve(response)

              })
              .catch((error) => {
                console.log('Error loading preview for', value.meta.worldName, error)
              })
          })

          return Promise.resolve(this.availableWorlds)
        })
        .catch((response) => {
          // console.log('error', error)
          return Promise.reject(response)
        })
    },
    async getRecordings () {
      // const uri = 'http://127.0.0.1:5001'
      const uri = window.location.origin
      return fetch(uri + `/api/v1/operations?tag=${this.searchFilterTag}&name=${this.searchFilterMissionName}&newer=${this.searchFilterOldest}&older=${this.searchFilterNewest}`, {
        cache: "no-cache"
      })
        .then((response) => {
          if (!response.status === 200) {
            return Promise.reject(response);
          }
          console.log(response)
          return Promise.resolve(response.json())
        })
        .then((data) => {
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
        })
        .catch((error) => {
          console.error(error);
          // this.availableRecordings = new Map([
          //   ['0', {
          //     "id": 0,
          //     "name": "Error",
          //     "date": "2021-01-01",
          //     "tag": "Error",
          //     "mission_name": "Failed to get data from server",
          //   }]
          // ])
          return Promise.reject(error);
        });

    },
    getRecordingData (operation) {

      // if already loaded & matching then return
      if (this.activeRecordingData?.missionName === operation.mission_name) {
        return
      }
      this.activeRecordingData = {
        "missionName": "Loading...",
        "author": "",
      }
      // const uri = 'http://127.0.0.1:5001'
      const uri = window.location.origin
      const path = `/data/${operation.filename}`
      return fetch(uri + path, {

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
          this.recordingUrl = uri + path
          var recordingWorld = this.availableWorlds.get(operation.world_name.toLowerCase())
          // console.log('recordingWorld', recordingWorld)
          if (recordingWorld) {
            this.activeWorld = recordingWorld
          } else {
            this.activeWorld = null
            alert('World data not available for ' + operation.world_name)
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