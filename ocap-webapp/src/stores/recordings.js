import { defineStore } from 'pinia'

export const useRecordingDataStore = defineStore('recordingData', {
  state: () => {
    return {
      availableRecordings: [],
      recordingData: {},
      recordingUrl: '',
      recordingMetadata: {},
      activeWorld: { worldName: 'tanoa', displayName: 'Tanoa' },
      viewBounds: {},
      currentZoom: 0,
      currentPitch: 0,
      currentBearing: 0,
      playbackMap: null,
      mousePosition: '',
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
    getRecordings () {
      const uri = 'http://127.0.0.1:5001'
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
    getRecordingData (filename) {
      const uri = 'http://127.0.0.1:5001'
      const path = `/data/${filename}`
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
          console.log('Success: Retrieved recording data for', filename);
          this.recordingData = recordingData
          return Promise.resolve();
        })
        .catch((error) => {
          console.error("Error retrieving recording data for", filename, error);
          return
        });
    },
  }
});