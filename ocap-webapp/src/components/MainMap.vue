<template>
  <div id="map-window">
    <div id="app-body">
      <div id="map" ref="maplibre"></div>
      <!-- <div id="style-button-container"> -->
      <fieldset id="style-button-container">
        <legend>{{ $t('mainMap.layerControlsTitle') }}</legend>
        <div class="field-row">
          <input
            type="checkbox"
            id="showColorRelief"
            v-model="showColorRelief"
            @change="toggleColorRelief"
          />
          <label for="showColorRelief">{{ $t('mainMap.colorRelief') }}</label>
        </div>

        <div class="field-row">
          <input
            type="checkbox"
            id="showSatellite"
            v-model="showSatellite"
            @change="toggleSatellite"
          />
          <label for="showSatellite">{{ $t('mainMap.satellite') }}</label>
        </div>

        <div class="field-row">
          <input
            type="checkbox"
            id="showHillshade"
            v-model="showHillshade"
            @change="toggleHillshade"
          />
          <label for="showHillshade">{{ $t('mainMap.hillshade') }}</label>
        </div>

        <div class="field-row">
          <input
            type="checkbox"
            id="showContourLines"
            v-model="showContourLines"
            @change="toggleContourLines"
          />
          <label for="showContourLines">{{ $t('mainMap.contourLines') }}</label>
        </div>

        <div class="field-row">
          <input type="checkbox" id="showTerrain" v-model="showTerrain" @change="toggleTerrain" />
          <label for="showTerrain">{{ $t('mainMap.3dTerrain') }}</label>
        </div>

        <div class="field-row">
          <input
            type="checkbox"
            id="showHouseExtrusion"
            v-model="showHouseExtrusion"
            @change="toggleHouseExtrusion"
          />
          <label for="showHouseExtrusion">{{ $t('mainMap.3dBuildings') }}</label>
        </div>
      </fieldset>

      <!-- </div> -->
    </div>
  </div>
</template>

<script setup>
import { Map, addProtocol, addControl, NavigationControl, ScaleControl } from 'maplibre-gl'
import * as pmtiles from 'pmtiles'
import * as turf from '@turf/turf'
import proj4 from 'proj4'
import { forward } from 'mgrs'
</script>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'
export default {
  name: 'MainMap',
  data() {
    return {
      // map: null,
      showColorRelief: false,
      showHillshade: true,
      showTerrain: false,
      showSatellite: false,
      showHouseExtrusion: true,
      showContourLines: true
    }
  },
  unmounted() {
    this.playbackMap.remove()
  },
  mounted() {
    // const initialState = { lng: 0, lat: 0, zoom: 14 }

    let protocol = new pmtiles.Protocol()
    addProtocol('pmtiles', protocol.tile)
    const map = new Map({
      container: this.$refs.maplibre,
      style: `https://styles.ocap2.com/${this.activeWorld.worldName}.json`,
      attributionControl: false
    })
    map.addControl(new NavigationControl())

    map.addControl(
      new ScaleControl({
        unit: 'imperial'
      }),
      'bottom-right'
    )
    map.addControl(
      new ScaleControl({
        unit: 'metric'
      }),
      'bottom-right'
    )

    this.playbackMap = map
    this.maplibreVersion = this.playbackMap.version

    // this.playbackMap.on('render', () => {
    //   this.centerOnMap()
    //   this.hideLayers()
    // })

    this.playbackMap.once('render', () => {
      this.centerOnMap()

      // this.activeWorld = this.playbackMap.getStyle().metadata

      this.currentZoom = this.playbackMap.getZoom().toFixed(2)

      this.playbackMap.on('move', () => {
        this.viewBounds = this.playbackMap.getBounds()
      })

      this.playbackMap.on('zoom', this.updateCurrentZoom)
      this.playbackMap.on('mousemove', this.updatemousePositionXY)
      this.playbackMap.on('pitch', this.updatePitchAndBearing)

      setTimeout(() => {
        this.playbackMap.resize()
        this.playbackMap.setPaintProperty('background', 'background-color', '#c0c0c0')
      }, 1000)
    })
  },
  computed: {
    ...mapWritableState(useRecordingDataStore, ['playbackMap']),
    ...mapState(useRecordingDataStore, ['recordingData', 'activeWorld']),
    ...mapWritableState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePositionXY',
      'mousePositionMGRS',
      'maplibreVersion',
      'activeWorld'
    ])
  },
  methods: {
    centerOnMap: function () {
      const bounds = this.playbackMap.getStyle().metadata.bounds
      var poly = turf.bboxPolygon(bounds)
      if (!this.playbackMap.getSource('boundary')) {
        this.playbackMap.addSource('boundary', {
          type: 'geojson',
          data: poly
        })
        this.playbackMap.addLayer({
          id: 'boundary',
          type: 'line',
          source: 'boundary',
          layout: {},
          paint: {
            'line-color': '#000',
            'line-width': 2
          }
        })
      } else {
        this.playbackMap.getSource('boundary').setData(poly)
      }

      const polyBounds = turf.bbox(poly)
      this.worldBounds = polyBounds
      // console.log(polyBounds);

      var newCameraTransform = this.playbackMap.cameraForBounds(polyBounds, {
        padding: { top: 15, bottom: 15, left: 15, right: 15 }
      })
      // console.log(newCameraTransform)
      this.playbackMap.jumpTo(newCameraTransform)
    },
    async updateCurrentZoom(e) {
      var zoom = e.target.getZoom()
      this.currentZoom = zoom.toFixed(2)
    },
    async updatemousePositionXY(e) {
      var coord_4326 = e.lngLat
      // console.log(coord_4326);
      // convert using proj
      var mercator = proj4(proj4.defs('EPSG:4326'), proj4.defs('EPSG:3857'), [
        coord_4326.lng,
        coord_4326.lat
      ])
      // console.log(mercator);
      var mercatorStr = [
        mercator[0].toFixed(0).toString().padStart(5, '0'),
        mercator[1].toFixed(0).toString().padStart(5, '0')
      ]
      this.mousePositionXY = mercatorStr[0] + ' ' + mercatorStr[1]

      // * calculate 8 digit MGRS grid from XY

      // * add origin pos of world from metadata to mercator
      // this is so Grid coords reflect 'real' position in world
      var meta = this.activeWorld
      var originLat = meta.latitude
      var originLon = meta.longitude
      var origin3857 = proj4(proj4.defs('EPSG:4326'), proj4.defs('EPSG:3857'), [
        originLon,
        originLat
      ])
      var originPlus3857 = [mercator[0] + origin3857[0], mercator[1] + origin3857[1]]
      var originPlus4326 = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), [
        originPlus3857[0],
        originPlus3857[1]
      ])

      // console.log(mercator, [originLat, originLon], originPlus3857, originPlus4326)

      // run through library
      var mgrsStr = this.latlonToMGRS(originPlus4326[0], originPlus4326[1], 4)

      this.mousePositionMGRS = mgrsStr
    },
    latlonToMGRS(lon, lat, precision) {
      var mgrs = forward([lon, lat], precision)

      // for zone, take first 3 digits of the MGRS string
      var mgrsZone = mgrs.slice(0, 3)

      // for numbers, take the last 8 digits of the MGRS string
      var mgrsGrid = mgrs.slice(-8)
      // split with space
      mgrsGrid = mgrsGrid.slice(0, 4) + ' ' + mgrsGrid.slice(4, 8)

      return mgrsZone + ' ' + mgrsGrid
    },
    async updatePitchAndBearing(e) {
      var pitch = e.target.getPitch()
      this.currentPitch = pitch.toFixed(2)
      var bearing = e.target.getBearing()
      this.currentBearing = bearing.toFixed(2)
    },
    resetTerrain: function () {
      if (this.playbackMap.getTerrain()) {
        this.playbackMap.setTerrain()
        this.playbackMap.setTerrain({ source: 'heightmap' })
        this.toggleTerrain()
      }
    },
    toggleColorRelief: function () {
      if (this.showColorRelief) {
        this.playbackMap.setLayoutProperty('color-relief', 'visibility', 'visible')
      } else {
        this.playbackMap.setLayoutProperty('color-relief', 'visibility', 'none')
      }
      this.resetTerrain()
    },
    toggleHillshade: function () {
      if (this.showHillshade) {
        this.playbackMap.setLayoutProperty('hillshade', 'visibility', 'visible')
      } else {
        this.playbackMap.setLayoutProperty('hillshade', 'visibility', 'none')
      }
      this.resetTerrain()
    },
    toggleTerrain: function () {
      if (this.showTerrain) {
        this.playbackMap.setTerrain({ source: 'heightmap' })
      } else {
        this.playbackMap.setTerrain()
      }
    },
    toggleSatellite: function () {
      if (this.showSatellite) {
        this.playbackMap.setLayoutProperty('satellite', 'visibility', 'visible')
      } else {
        this.playbackMap.setLayoutProperty('satellite', 'visibility', 'none')
      }
      this.resetTerrain()
    },
    toggleHouseExtrusion: function () {
      if (this.showHouseExtrusion) {
        this.playbackMap.setLayoutProperty('house-extrusion', 'visibility', 'visible')
      } else {
        this.playbackMap.setLayoutProperty('house-extrusion', 'visibility', 'none')
      }
      this.resetTerrain()
    },
    toggleContourLines: function () {
      if (this.showContourLines) {
        this.playbackMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith('contours')) {
            this.playbackMap.setLayoutProperty(layer.id, 'visibility', 'visible')
          }
        })
      } else {
        this.playbackMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith('contours')) {
            this.playbackMap.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        })
      }
      this.resetTerrain()
    }
  }
}
</script>

<style scoped>
@import 'maplibre-gl/dist/maplibre-gl.css';

#map-window {
  width: auto;
  height: 100%;
  position: relative;
}

#app-body {
  width: auto;
  height: 100%;
  position: relative;
}

#map {
  width: auto;
  height: 100%;
  position: relative;
  border: 1px solid #000000;
}

#style-button-container {
  /* background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.3); */
  /* font-family: 'Roboto', 'sans-serif'; */
  position: absolute;
  top: 10px;
  left: 10px;
  height: fit-content;
  width: 15%;
  min-width: 120px;
  background-color: #c0c0c0;
  /* display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start; */
}

.style-option {
  align-items: center;
  display: flex;
  padding: 5px;
}

.style-option > label {
  /* font-size: 10px; */
  font-family: 'Arial', 'sans-serif';
}
</style>
