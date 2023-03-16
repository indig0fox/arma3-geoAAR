<script>
import 'maplibre-gl/dist/maplibre-gl.css'
import MainMap from '@/components/MainMap.vue'
import MapStateStatusBar from '@/components/MapStateStatusBar.vue'
import MiniMap from '@/components/MiniMap.vue'

import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/dataStore.js'

export default {
  name: 'WorldViewer',
  components: { MainMap, MapStateStatusBar, MiniMap },
  setup() {},
  data() {
    return {
      style: {},
      satStyle: {},
      hybridStyle: {}
    }
  },
  computed: {
    ...mapState(useRecordingDataStore, ['recordingData', 'activeWorld']),
    ...mapState(useRecordingDataStore, ['mainMap']),
    ...mapState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePositionXY',
      'maplibreVersion'
    ])
  },
  created() {
    // const fetchStyle = async () => {
    //   // const response = await fetch('https://styles.ocap2.com/' + this.worldname + '.json')
    //   const response = await fetch('https://styles.ocap2.com/' + this.activeWorld + '.json')
    //   const data = await response.json()
    //   this.style = data
    //   // console.log(this.style);
    // }
    // const fetchSatStyle = async () => {
    //   // const response = await fetch('https://styles.ocap2.com/' + this.worldname + '-satellite.json')
    //   const response = await fetch(
    //     'https://styles.ocap2.com/' + this.activeWorld + '-satellite.json'
    //   )
    //   const data = await response.json()
    //   this.satStyle = data
    //   // console.log(this.satStyle);
    // }
    // const fetchHybridStyle = async () => {
    //   // const response = await fetch('https://styles.ocap2.com/' + this.worldname + '-hybrid.json')
    //   const response = await fetch('https://styles.ocap2.com/' + this.activeWorld + '-hybrid.json')
    //   if (response.status === 404) {
    //     return
    //   }
    //   const data = await response.json()
    //   this.hybridStyle = data
    //   // console.log(this.satStyle);
    // }
    // fetchStyle()
    // fetchSatStyle()
    // fetchHybridStyle()
  },
  mounted() {
    // this.initMap()
    // this.initHandlers()
    // this.mapInit = true
  },
  unmounted() {
    // this.map.remove()
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

<template>
  <div id="world-viewer-container">
    <div
      id="terrain-analyzer-window"
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
      <!-- <div id="map" v-show="mapLoaded"></div> -->
      <div id="map-container" class="window-body">
        <MainMap v-if="activeWorld" />
      </div>
      <div id="map-container-bottom">
        <MapStateStatusBar v-if="activeWorld" />
      </div>
    </div>
    <div id="right-panel" class="panel">
      <div
        id="minimap-container"
        class="window"
        @mouseenter="adjustActiveState"
        @mouseleave="adjustActiveState"
      >
        <div class="title-bar inactive">
          <div class="title-bar-text">{{ $t('miniMap.windowTitle') }}</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div id="minimap-container-body" class="window-body">
          <!-- <div id="map-overview" v-if="style.metadata"></div> -->
          <MiniMap v-if="activeWorld" />
          <!-- <div id="style-controls-group">
            <legend>Style Controls</legend> -->

          <!-- style select -->
          <!-- <fieldset v-if="style.metadata && satStyle.metadata">
              <legend>Map Style</legend>
              <select id="style-select" v-model="selectedStyle" @change="setStyle">
                <option
                  v-for="styleName in Object.keys(styleList)"
                  :key="styleName"
                  :value="styleName"
                >
                  {{ styleName }}
                </option>
              </select>
            </fieldset> -->

          <!-- <fieldset>
              <legend>Layers</legend> -->
          <!-- grid -->
          <!-- <div class="field-row">
                <input
                  type="checkbox"
                  id="show-grid"
                  v-model="showGrid"
                  @change="this.toggleGrid()"
                />
                <label for="show-grid">Show Grid</label>
              </div> -->
          <!-- hillshade -->
          <!-- <div class="field-row">
                <input
                  type="checkbox"
                  id="show-hillshade"
                  v-model="showHillshade"
                  @change="this.toggleHillshade()"
                />
                <label for="show-hillshade">Show Hillshade</label>
              </div> -->
          <!-- 3d terrain -->
          <!-- <div class="field-row">
                <input type="checkbox" id="show-3d" v-model="show3d" @change="this.toggle3d()" />
                <label for="show-3d">Show 3D Terrain</label>
              </div>
            </fieldset>
          </div> -->
        </div>
      </div>
      <!-- <DrawComponent v-if="style.metadata" :map="map" :worldName="style.metadata.worldName" /> -->
    </div>
  </div>
</template>

<style scoped>
#world-viewer-container {
  /* top: 0;
  left: 0;
  bottom: 0; */
  width: 100%;
  height: 100%;
  min-height: 640px;
  min-width: 480px;

  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
}
#terrain-analyzer-window {
  width: 100%;
  height: 100%;
  position: relative;
  /* min-width: 480px; */
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  /* border-radius: 10px 10px 0 0; */
}
#map-container {
  height: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  /* border: 10px solid #000; */
}
#map {
  height: auto;
  flex: 1;
  z-index: 0;
  /* border: 10px solid #000; */
}

.panel {
  width: 30%;
  min-width: 300px;
  height: auto;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: stretch;
}

.panel > .title-bar {
  width: auto;
}

#minimap-container {
  height: 250px;
  min-height: 250px;
  max-height: 250px;

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

#map-overview {
  width: 100%;
  min-width: 75px;
  height: 100%;
  flex: 1;
  border: 1px solid #000;
}

#style-controls-group {
  height: 100%;
  width: 50%;
  min-width: 150px;
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: stretch;
  align-items: stretch;
  gap: 10px;
}

#style-controls-group > fieldset {
  width: auto;
  height: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  gap: 10px;
}
.status-bar {
  display: flex;
  /* justify-content: flex-start; */
  /* align-items: center; */
  flex-wrap: nowrap;
}
</style>
