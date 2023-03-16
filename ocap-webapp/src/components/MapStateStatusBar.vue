<template>
  <div class="status-bar">
    <div class="status-bar-field status-bar-short">
      <span><ClockComponent /></span>
      <br />
      <span>Running Maplibre v{{ maplibreVersion }}</span>
    </div>

    <!-- <p class="status-bar-field status-bar-short">
      CursorPos: {{ mousePositionXY }}<br />
      Zoom: {{ currentZoom }} -- Pitch: {{ currentPitch }}
    </p> -->

    <p
      class="status-bar-field"
      v-if="mapIsLoaded"
      v-html="mainMap?.getSource('features')?.attribution"
    ></p>
  </div>
</template>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/dataStore.js'

import ClockComponent from '@/components/ClockComponent.vue'

export default {
  components: { ClockComponent },
  data() {
    return {
      mapIsLoaded: false
    }
  },
  mounted() {
    // wait for map to load
    this.mapIsLoaded = false
    this.mainMap.once('styledata', () => {
      setTimeout(() => {
        this.mapIsLoaded = true
      }, 750)
    })
  },
  computed: {
    ...mapState(useRecordingDataStore, ['mainMap']),
    ...mapState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePositionXY',
      'maplibreVersion'
    ])
  }
}
</script>

<style scoped>
.status-bar-short {
  min-width: 145px;
}
</style>
