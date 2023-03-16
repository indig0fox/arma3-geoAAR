<template>
  <div id="minimap" ref="minimapContainer">
    <!-- show zoom and cursor pos in corner -->
    <div id="minimap-info" class="minimap-info">
      Zoom: {{ currentZoom }}<br />
      Cursor XY: {{ mousePositionXY }}<br />
      Cursor MGRS: {{ mousePositionMGRS }}
    </div>
  </div>
</template>

<script setup>
import { Map, addProtocol, addControl, NavigationControl } from 'maplibre-gl'
import * as pmtiles from 'pmtiles'
import * as turf from '@turf/turf'
import proj4 from 'proj4'
</script>

<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/dataStore.js'
export default {
  name: 'MiniMap',
  data() {
    return {
      map: null,
      trackingRectCoordinates: [[[], [], [], [], []]]
    }
  },
  computed: {
    ...mapState(useRecordingDataStore, ['recordingData', 'activeWorld']),
    ...mapState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      // 'currentPitch',
      // 'currentBearing',
      'mousePositionXY',
      'mousePositionMGRS',
      // 'maplibreVersion',
      'mainMap'
    ])
  },
  unmounted() {
    this.map.remove()
  },
  mounted() {
    // const initialState = { lng: 0, lat: 0, zoom: 14 }

    let protocol = new pmtiles.Protocol()
    addProtocol('pmtiles', protocol.tile)
    const map = new Map({
      container: this.$refs.minimapContainer,
      style: `https://styles.ocap2.com/${this.activeWorld.worldName}.json`,
      attributionControl: false,
      interactive: false,
      antialias: false
    })
    this.map = map

    this.map.once('render', () => {
      this.centerOnMap()
      this.hideLayers()

      setTimeout(() => {
        this.map.resize()
        this.map.setPaintProperty('background', 'background-color', '#c0c0c0')
      }, 1000)

      if (this.map.getSource('trackingRect')) {
        this.map.removeLayer('trackingRectOutline')
        this.map.removeLayer('trackingRectFill')
        this.map.removeSource('trackingRect')
      }
      this.map.addSource('trackingRect', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [0, 0.15],
                [0.15, 0.15],
                [0.15, 0],
                [0, 0]
              ]
            ]
          }
        }
      })

      this.map.addLayer({
        id: 'trackingRectOutline',
        type: 'line',
        source: 'trackingRect',
        layout: {},
        paint: {
          'line-color': '#F00',
          'line-width': 2,
          'line-opacity': 1
        }
      })

      // needed for dragging
      this.map.addLayer({
        id: 'trackingRectFill',
        type: 'fill',
        source: 'trackingRect',
        layout: {},
        paint: {
          'fill-color': '#F80',
          'fill-opacity': 0.25
        }
      })

      this.map.on('click', (e) => {
        const newCenter = e.lngLat
        this.mainMap.setCenter(newCenter)
      })
    })
  },
  methods: {
    centerOnMap: function () {
      const bounds = this.map.getStyle().metadata.bounds
      // console.log(bounds);
      var poly = turf.bboxPolygon(bounds)
      if (!this.map.getSource('boundary')) {
        this.map.addSource('boundary', {
          type: 'geojson',
          data: poly
        })
        this.map.addLayer({
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
        this.map.getSource('boundary').setData(poly)
      }

      const polyBounds = turf.bbox(poly)
      this.worldBounds = polyBounds
      // console.log(polyBounds);

      var newCameraTransform = this.map.cameraForBounds(polyBounds, {
        padding: { top: 5, bottom: 5, left: 5, right: 5 }
      })
      // console.log(newCameraTransform)
      this.map.jumpTo(newCameraTransform)
    },
    hideLayers: function () {
      // hide all layers except background, land, sea, hillshade
      this.map.on('render', () => {
        this.map.getStyle().layers.forEach((layer) => {
          if (
            [
              'background',
              'land',
              'sea',
              'hillshade',
              'forest',
              'runway',
              'road',
              'main_road',
              'trackingRectFill',
              'trackingRectOutline'
            ].includes(layer.id)
          ) {
            this.map.setLayerZoomRange(layer.id, 0, 24)
            return
          }
          this.map.setLayoutProperty(layer.id, 'visibility', 'none')
        })
        this.map.setPaintProperty('background', 'background-color', '#c0c0c0')
      })
    }
  },
  watch: {
    viewBounds: function (newBounds) {
      if (this.viewBounds === {} || !this.map?.loaded()) return
      const source = this.map.getSource('trackingRect')

      // maplibre bounds object
      const boundsCoords = [
        [newBounds._ne.lng, newBounds._ne.lat],
        [newBounds._ne.lng, newBounds._sw.lat],
        [newBounds._sw.lng, newBounds._sw.lat],
        [newBounds._sw.lng, newBounds._ne.lat],
        [newBounds._ne.lng, newBounds._ne.lat]
      ]

      const tgt = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [boundsCoords]
        }
      }

      source.setData(tgt)
    }
  }
}
</script>

<style scoped>
@import 'maplibre-gl/dist/maplibre-gl.css';

#minimap {
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  align-self: auto;
  /* embedded/inset look */
  border: 1px solid #000;
  /* border-radius: 5px; */
  /* box-shadow: 0 0 5px #000; */
  background: #252525;
}

#minimap-info {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 0 5px;
  /* background: rgba(0, 0, 0, 0.5); */
  color: #2c2c2c;
  text-shadow: 0 0 1px #000;
  font-size: 10px;
  font-family: monospace;
  line-height: 1em;
  white-space: nowrap;
  margin: 0px;
  pointer-events: none;
}
</style>
