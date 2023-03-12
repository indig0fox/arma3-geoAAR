<template>
  <div id="panel-content">
    <div class="map-panel-left-header">
      <h2>Left Panel</h2>
    </div>
    <div id="map-panel-left-content" class="panel-content">
      <h2>Content</h2>
    </div>
  </div>
</template>

<script setup>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '../stores/recordings.js'
// const recordingData = useRecordingDataStore()
</script>

<script>
export default {
  name: 'MapLeftPanel',
  data() {
    return {
      map: null
    }
  },
  mounted() {},
  computed: {
    ...mapState(useRecordingDataStore, ['recordingData'])
  }
}
</script>

<style></style>
