import { defineStore } from 'pinia'

export const useRecordingDataStore = defineStore('recordingData', {
  state: () => {
    return {
      availableRecordings: [],
      recordingData: {},
      recordingUrl: '',
      recordingMetadata: {},
      searchFilterOldest: '2017-06-01',
      searchFilterNewest: '2099-12-12',
      searchFilterTag: '',
      searchFilterMission: ''
    }
  },
  // could also be defined as
  // state: () => ({ count: 0 })
  actions: {
    getRecordings () {
      const uri = 'http://127.0.0.1:5001'
      return fetch(`/api/v1/operations?tag=${this.searchFilterTag}&name=${this.searchFilterMission}&newer=${this.searchFilterOldest}&older=${this.searchFilterNewest}`, {
        cache: "no-cache"
      })
        .then((response) => response.json())
        .then((data) => {
          const OpList = data;
          // sort by newest first, using yyyy-mm-dd format in Date field
          OpList.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
          // console.log('Success:', OpList);
          Promise.resolve(this.availableRecordings = OpList);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    },
    getRecordingData (filename) {
      const uri = `/data/${filename}`
      return fetch(uri, {
        cache: "no-cache"
      })
        .then((response) => response.json())
        .then((data) => {
          const recordingData = data;
          // console.log('Success:', recordingData);
          Promise.resolve(this.recordingData = recordingData);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    },
  }
});