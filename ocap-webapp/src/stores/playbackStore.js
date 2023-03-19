import { defineStore } from 'pinia'

export const usePlaybackDataStore = defineStore('playbackData', {
  state: () => {
    return {
      playbackInitialized: false,
      playbackRenderId: null,
      playbackNextFrame: null,
      playbackEntities: {},
      playbackEntitiesGeoJSON: {
        type: 'FeatureCollection',
        features: []
      },
      playbackCurrentFrame: 0,
      playbackCurrentTimestamp: '00:00:00',
      playbackRunning: false,
      playbackSpeed: 10,
      showUnitMarkers: true,
      showUnitLabels: true,
      showAILabels: false,
      showVehicleMarkers: true,
      showVehicleLabels: true,
      selectedUnitId: null,
    }
  },
  actions: {

  }
})
