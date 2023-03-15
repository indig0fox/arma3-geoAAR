<template>
  <div
    id="error-window"
    class="window"
    @mouseenter="adjustActiveState"
    @mouseleave="adjustActiveState"
  >
    <div class="title-bar">
      <div class="title-bar-text">
        {{ $t('windowTitles.errorWindow') }}
      </div>
      <!-- <div class="title-bar-text">
        <img src="@/assets/terrain_icon.svg" class="title-bar-icon" />Recording Viewer -
      </div> -->

      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body">
      <div id="error-window-body">
        <p>{{ error.message }}</p>
        <p>API Url: {{ apiUrl }}</p>
        <p>
          {{ error.data }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'
export default {
  name: 'ErrorPage',
  computed: {
    ...mapState(useRecordingDataStore, ['error', 'apiUrl'])
  },
  mounted() {},
  methods: {
    adjustActiveState(e) {
      // get title-bar element beneath
      var titleBar = e.target.querySelector('.title-bar')
      if (e.type == 'mouseenter') {
        titleBar.classList.remove('inactive')
      } else {
        titleBar.classList.add('inactive')
      }
    }
  }
}
</script>

<style scoped>
#error-window {
  width: 340px;
  height: 200px;
  display: flex;
  flex-direction: column;
}
#error-window-body {
  font-family: monospace;
}
</style>