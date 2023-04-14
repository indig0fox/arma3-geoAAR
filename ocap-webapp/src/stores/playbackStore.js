import { defineStore } from 'pinia'
import proj4 from 'proj4'

export const usePlaybackDataStore = defineStore('playbackData', {
  state: () => {
    return {
      playbackInitialized: false,
      playbackRenderId: null,
      playbackNextFrame: null,
      playbackEntities: {},

      selectedUnitPathGeoJSON: {
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
      showSelectedUnitPath: true,
      followSelectedUnit: false,
    }
  },
  actions: {
    getUnitById (id) {
      return this.playbackEntities[id]
    },
    getUnitHistory (id, frames) {
      const entity = this.getUnitById(id)
      const startFrame = Math.max(0, this.playbackCurrentFrame - 30)
      const endFrame = this.playbackCurrentFrame
      const history = []
      for (let i = startFrame; i < endFrame; i++) {
        history.push(entity.positions.get(i))
      }
      // console.log(history)
      return history
    },
    getPlaybackEntitiesGeoJSON: function () {
      const geoJSON = {
        type: 'FeatureCollection',
        features: []
      }
      if (!this.playbackInitialized) {
        return geoJSON
      }
      for (const id in this.playbackEntities) {
        const entity = this.playbackEntities[id]

        const feature = {
          type: 'Feature',
          id: id,
          properties: {
            ...entity.position
          }
        }
        geoJSON.features.push(feature)
      }
      return geoJSON


    },

  }
})
