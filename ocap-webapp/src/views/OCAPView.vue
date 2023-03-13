<script setup>
import { Map, addProtocol, addControl, NavigationControl } from 'maplibre-gl'
import * as pmtiles from 'pmtiles'

import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'

import { ref } from 'vue'
import MainMap from '@/components/MainMap.vue'
import MapStateStatusBar from '@/components/MapStateStatusBar.vue'
import MiniMap from '@/components/MiniMap.vue'
import ClockComponent from '@/components/ClockComponent.vue'
import MapLeftPanel from '@/components/MapLeftPanel.vue'
import PlaybackManager from '@/components/PlaybackManager.vue'
</script>

<template>
  <div
    id="main-page"
    class="window"
    @mouseenter="adjustActiveState"
    @mouseleave="adjustActiveState"
  >
    <div class="title-bar">
      <div class="title-bar-text">
        <img src="@/assets/img/terrain_icon.svg" class="title-bar-icon" />
        {{ $t('windowTitles.recordingViewer') }}
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
    <div id="app-body" class="window-body">
      <div id="main-page-header">
        <h4>OCAP</h4>
        <!-- <button @click="showRecordingModal = true">Show Recordings</button> -->
        <!-- <RecordingsModal
        key="{{ recordings }}"
        v-show="showRecordingModal"
        @close="showRecordingModal = false"
      /> -->
      </div>
      <div id="main-page-container">
        <div id="main-page-panel-left" class="panel-container">
          <MapLeftPanel />
        </div>
        <div id="main-page-panel-center" class="panel-container">
          <div id="main-page-content-center" class="panel-content">
            <div
              id="map-container"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar">
                <div class="title-bar-text">
                  <img src="@/assets/img/terrain_icon.svg" class="title-bar-icon" />
                  {{ $t('mainMap.windowTitle') }}
                </div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="map-container-body" class="window-body">
                <MainMap :key="activeWorld" />
              </div>
              <MapStateStatusBar />
            </div>

            <div
              id="playback-container"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar">
                <div class="title-bar-text">
                  <img src="@/assets/img/terrain_icon.svg" class="title-bar-icon" />Playback Manager
                </div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="playback-container-body" class="window-body">
                <PlaybackManager />
              </div>
            </div>
          </div>
        </div>
        <div id="main-page-panel-right" class="panel-container">
          <div id="main-page-content-right" class="panel-content">
            <div
              id="minimap-container"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar inactive">
                <div class="title-bar-text">Minimap</div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="minimap-container-body" class="window-body">
                <MiniMap :key="activeWorld" />
              </div>
            </div>
            <h3>Right</h3>
          </div>
        </div>
      </div>
      <!-- <div id="footer"> -->

      <!-- </div> -->
    </div>
    <div class="status-bar">
      <p class="status-bar-field" style="max-width: 128px">
        <ClockComponent />
        Running Maplibre v{{ maplibreVersion }}
      </p>
      <p class="status-bar-field" style="max-width: 128px">
        CursorPos: {{ mousePositionXY }}<br />
        Zoom: {{ currentZoom }} -- Pitch: {{ currentPitch }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'
const showRecordingModal = ref(false)

export default {
  components: { MainMap, MiniMap, MapLeftPanel, ClockComponent },
  name: 'OCAPView',
  data() {
    return {}
  },
  created() {
    const recordingData = useRecordingDataStore()
  },
  mounted() {},
  computed: {
    ...mapState(useRecordingDataStore, ['playbackMap']),
    ...mapWritableState(useRecordingDataStore, ['recordingData', 'activeWorld']),
    ...mapState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePositionXY',
      'maplibreVersion'
    ])
  },
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
#main-page {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#main-page-container {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: row;
}

#app-body {
  width: auto;
  height: inherit;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}

#main-page-panel-left,
#main-page-panel-right {
  width: 30%;
}
#main-page-panel-center {
  width: 75%;
}

.panel-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  width: auto;
  height: 100%;
  background-color: lightsteelblue;
}

.panel-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  width: auto;
  height: 100%;
  /* padding: 5px; */
  /* border: 5px outset mediumturquoise; */
}

#map-container,
#map-container-body,
#playback-container,
#playback-container-body {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* padding: 10px; */
}

#map-container {
  height: 75%;
}
#playback-container {
  height: 25%;
}

#minimap-container {
  min-height: 256px;
  max-height: 256px;

  width: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  /* gap: 5px; */
}
#minimap-container-body {
  height: 100%;
  width: auto;
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 5px;
  justify-content: stretch;
}
</style>
