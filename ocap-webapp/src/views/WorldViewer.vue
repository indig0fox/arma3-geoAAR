<script>
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as pmtiles from 'pmtiles'
import { minimapControl } from '@/assets/maplibregl.minimap'
import * as turf from '@turf/turf'
import proj4 from 'proj4'
import MainMap from '@/components/MainMap.vue'
import MapStateStatusBar from '@/components/MapStateStatusBar.vue'
import MiniMap from '@/components/MiniMap.vue'

import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'

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
    ...mapState(useRecordingDataStore, ['playbackMap']),
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
    },

    generateGrids: function () {
      // const gridOffsetX = this.map.getStyle().metadata.gridOffsetX;
      // const gridOffsetY = this.map.getStyle().metadata.gridOffsetY;
      const worldSize = this.map.getStyle().metadata.worldSize

      this.map.getStyle().metadata.grids.forEach((grid) => {
        // create a new multi-line string feature for each grid
        const coords3857 = []
        const labels3857 = []
        // const linestrings3857 = [];

        // add each line string to the feature
        for (let x = 0; x <= worldSize; x += grid['stepX']) {
          coords3857.push([
            [x, 0],
            [x, worldSize]
          ])
          // todo: add a point at y=gridOffsetY indicating X value
          // label is length of formatX value
          var xlength = grid['formatX'].length
          var xlabel = x / grid['stepX']
          xlabel = xlabel.toString().slice(0, xlength)
          if (xlabel.length < xlength) {
            xlabel = '0' + xlabel
          }

          labels3857.push(turf.point([x, worldSize], { label: xlabel }))
          labels3857.push(turf.point([x, 0], { label: xlabel }))
          // linestrings3857.push(turf.lineString([[x, gridOffsetX], [x, gridOffsetY]], { label: label }))
        }
        for (let y = 0; y <= worldSize; y += Math.abs(grid['stepY'])) {
          coords3857.push([
            [0, y],
            [worldSize, y]
          ])
          // todo: add a point at x=gridOffsetX indicating Y value
          // label is length of formatY value
          var ylength = grid['formatY'].length
          var ylabel = y / Math.abs(grid['stepY'])
          ylabel = ylabel.toString().slice(0, ylength)
          if (ylabel.length < ylength) {
            ylabel = '0' + ylabel
          }
          labels3857.push(turf.point([0, y], { label: ylabel }))
          labels3857.push(turf.point([worldSize, y], { label: ylabel }))
          // linestrings3857.push(turf.lineString([[gridOffsetX, y], [gridOffsetY, y]], { label: label }))
        }

        const coords4326 = coords3857.map((coord) => {
          return coord.map((c) => {
            return proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [c[0], c[1]])
          })
        })
        const labels4326 = labels3857.map((label) => {
          return turf.point(
            proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [
              label.geometry.coordinates[0],
              label.geometry.coordinates[1]
            ]),
            label.properties
          )
        })
        // const linestrings4326 = linestrings3857.map(linestring => {
        //   return turf.lineString(linestring.geometry.coordinates.map(coord => {
        //     return proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [coord[0], coord[1]])
        //   }), linestring.properties)
        // })

        // create a new geojson object
        let featureCollection = turf.featureCollection([])

        // create the features
        const multiLineString = turf.multiLineString(coords4326)
        featureCollection.features.push(multiLineString)

        // add the labels
        labels4326.forEach((label) => {
          featureCollection.features.push(label)
        })

        // // add the linestrings
        // linestrings4326.forEach(linestring => {
        //   featureCollection.features.push(linestring)
        // })

        // add the feature to the source
        // add new geojson source to contain grid linestrings
        this.map.addSource(`grid-${grid['stepX']}`, {
          type: 'geojson',
          data: featureCollection
        })

        // get length of step
        var minZoom
        var maxZoom
        if (grid['stepX'] == 100) {
          minZoom = 16
          maxZoom = 20
        }
        if (grid['stepX'] == 1000) {
          minZoom = 12
          maxZoom = 16
        }
        if (grid['stepX'] == 10000) {
          minZoom = 8
          maxZoom = 12
        }

        // add a new lines layer for each grid
        this.map.addLayer({
          id: `grid-${grid['stepX']}`,
          type: 'line',
          source: `grid-${grid['stepX']}`,
          minzoom: minZoom,
          maxzoom: maxZoom,
          paint: {
            'line-color': '#000',
            'line-width': 1
          }
        })

        // add labels layer
        this.map.addLayer({
          id: `grid-${grid['stepX']}-labels`,
          type: 'symbol',
          source: `grid-${grid['stepX']}`,
          minzoom: minZoom,
          maxzoom: maxZoom,
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 14,
            // 'text-allow-overlap': true,
            // 'text-ignore-placement': true,
            'text-font': ['Roboto Bold', 'Arial Unicode MS Regular'],
            // 'symbol-placement': 'line',
            'text-pitch-alignment': 'viewport',
            'text-rotation-alignment': 'map',
            'text-anchor': 'center',
            // 'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            // 'text-radial-offset': 0.5,
            // 'text-justify': 'auto',
            'text-keep-upright': true
          },
          paint: {
            'text-color': '#fff',
            'text-halo-color': '#000',
            'text-halo-width': 1
          }
        })
      })
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
