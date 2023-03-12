<template>
  <div class="status-bar">
    <div class="status-bar-field status-bar-short">
      <span><ClockComponent /></span>
      <br />
      <span>Running Maplibre v{{ maplibreVersion }}</span>
    </div>

    <p class="status-bar-field status-bar-short">
      CursorPos: {{ mousePosition }}<br />
      Zoom: {{ currentZoom }} -- Pitch: {{ currentPitch }}
    </p>

    <p
      class="status-bar-field"
      v-if="mapIsLoaded"
      v-html="playbackMap.getSource('features').attribution"
    ></p>
  </div>
</template>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'

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
    this.playbackMap.once('render', () => {
      setTimeout(() => {
        this.mapIsLoaded = true
      }, 750)
    })
  },
  computed: {
    ...mapState(useRecordingDataStore, ['playbackMap']),
    ...mapState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePosition',
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
