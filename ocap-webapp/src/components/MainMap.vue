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

        <div class="field-row">
          <input
            type="checkbox"
            id="showGridlines"
            v-model="showGridlines"
            @change="toggleGridlines"
          />
          <label for="showGridlines">{{ $t('mainMap.gridlines') }}</label>
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
      showContourLines: true,
      showGridlines: false,
      queryString: ''
    }
  },
  unmounted() {
    this.playbackMap.remove()
  },
  mounted() {
    var items = []
    Object.entries(this.$route.query).forEach(([key, value]) => {
      items.push(`${key}=${value}`)
    })
    this.queryString = items.join('&')

    let protocol = new pmtiles.Protocol()
    addProtocol('pmtiles', protocol.tile)
    const map = new Map({
      container: this.$refs.maplibre,
      style: `https://styles.ocap2.com/${this.activeWorld.worldName}.json`,
      attributionControl: false
    })

    console.log(this.queryString)

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

      this.playbackMap.transform._fov = 1

      // this.activeWorld = this.playbackMap.getStyle().metadata

      this.currentZoom = this.playbackMap.getZoom().toFixed(2)

      this.playbackMap.on('move', () => {
        this.viewBounds = this.playbackMap.getBounds()
      })

      this.playbackMap.on('moveend', () => {
        var center = this.playbackMap.getCenter()
        this.currentCenter = [center.lat, center.lng]
        this.$router.push({
          query: this.mapHash ? { ...this.$route.query, ...this.mapHash } : this.$route.query
        })
      })

      this.playbackMap.on('zoom', this.updateCurrentZoom)
      this.playbackMap.on('mousemove', this.updatemousePositionXY)
      this.playbackMap.on('pitch', this.updatePitchAndBearing)

      setTimeout(() => {
        this.playbackMap.resize()
        this.playbackMap.setPaintProperty('background', 'background-color', '#c0c0c0')
        this.generateGrids()
      }, 1000)
    })
  },
  computed: {
    worldOrigin4326() {
      const meta = this.activeWorld
      var originLat = meta.latitude
      var originLon = meta.longitude
      return [originLon, originLat]
    },
    worldOrigin3857() {
      if (!this.worldOrigin4326) return
      return proj4('EPSG:4326', 'EPSG:3857', this.worldOrigin4326)
    },
    ...mapWritableState(useRecordingDataStore, ['playbackMap']),
    ...mapState(useRecordingDataStore, ['recordingData', 'availableWorlds', 'mapHash']),
    ...mapWritableState(useRecordingDataStore, [
      'viewBounds',
      'currentCenter',
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

      let customQuery = false

      if (this.$route.query.z) {
        customQuery = true
        this.playbackMap.setZoom(this.$route.query.z)
      }

      if (this.$route.query.cnt) {
        customQuery = true
        var cnt = this.$route.query.cnt.split(',')
        this.playbackMap.setCenter([cnt[1], cnt[0]])
      }

      if (this.$route.query.b) {
        customQuery = true
        this.playbackMap.setBearing(this.$route.query.b)
      }

      if (this.$route.query.p) {
        customQuery = true
        this.playbackMap.setPitch(this.$route.query.p)
      }

      if (customQuery) {
        return
      }

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
      if (
        this.playbackMap.isMoving() ||
        this.playbackMap.isZooming() ||
        this.playbackMap.isRotating()
      ) {
        return
      }
      var coord_4326 = e.lngLat
      var coord_3857 = proj4('EPSG:4326', 'EPSG:3857', [coord_4326.lng, coord_4326.lat])

      var mercatorStr = [
        Math.abs(coord_3857[0]).toFixed(0).toString().padStart(5, '0'),
        Math.abs(coord_3857[1]).toFixed(0).toString().padStart(5, '0')
      ]

      // * add negative sign if needed
      coord_3857[0] < 0
        ? (mercatorStr[0] = '-' + mercatorStr[0])
        : (mercatorStr[0] = mercatorStr[0])
      coord_3857[1] < 0
        ? (mercatorStr[1] = '-' + mercatorStr[1])
        : (mercatorStr[1] = mercatorStr[1])

      this.mousePositionXY = mercatorStr[0] + ' ' + mercatorStr[1]

      // * calculate 8 digit MGRS grid from XY

      // * add origin pos of world from metadata to mercator
      // this is so Grid coords reflect 'real' position in world

      if (!this.worldOrigin3857) return

      // console.log(originLat, originLon)
      var originPlus3857 = [
        coord_3857[0] + this.worldOrigin3857[0],
        coord_3857[1] + this.worldOrigin3857[1]
      ]

      // console.log(origin3857, originPlus3857)

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

      var mgrsGridZone = mgrs.slice(3, 5)

      // for numbers, take the last 8 digits of the MGRS string
      var mgrsGrid = mgrs.slice(-8)
      // split with space
      mgrsGrid = mgrsGrid.slice(0, 4) + ' ' + mgrsGrid.slice(4, 8)

      return mgrsZone + ' ' + mgrsGridZone + ' ' + mgrsGrid
      return mgrs
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
    },
    toggleGridlines: function () {
      if (this.showGridlines) {
        this.playbackMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith('grid')) {
            this.playbackMap.setLayoutProperty(layer.id, 'visibility', 'visible')
          }
        })
      } else {
        this.playbackMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith('grid')) {
            this.playbackMap.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        })
      }
      this.resetTerrain()
    },
    generateGrids: function () {
      // const gridOffsetX = this.map.getStyle().metadata.gridOffsetX;
      // const gridOffsetY = this.map.getStyle().metadata.gridOffsetY;
      const worldSize = this.playbackMap.getStyle().metadata.worldSize

      this.playbackMap.getStyle().metadata.grids.forEach((grid) => {
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
        this.playbackMap.addSource(`grid-${grid['stepX']}`, {
          type: 'geojson',
          data: featureCollection
        })

        // get length of step
        var minZoom
        var maxZoom = 22
        var width = 1
        if (grid['stepX'] == 100) {
          minZoom = 15
          // maxZoom = 20
          width = 0.5
        }
        if (grid['stepX'] == 1000) {
          minZoom = 12
          // maxZoom = 16
          width = 1.5
        }
        if (grid['stepX'] == 10000) {
          minZoom = 8
          // maxZoom = 12
          width = 2.5
        }

        // add a new lines layer for each grid
        this.playbackMap.addLayer({
          id: `grid-${grid['stepX']}`,
          type: 'line',
          source: `grid-${grid['stepX']}`,
          minzoom: minZoom,
          maxzoom: maxZoom,
          layout: {
            visibility: 'none'
          },
          paint: {
            'line-color': '#000',
            'line-width': width
          }
        })

        // add labels layer
        this.playbackMap.addLayer({
          id: `grid-${grid['stepX']}-labels`,
          type: 'symbol',
          source: `grid-${grid['stepX']}`,
          minzoom: minZoom,
          maxzoom: maxZoom,
          layout: {
            visibility: 'none',
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
