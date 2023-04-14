<template>
  <div id="map" ref="map"></div>
</template>

<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
</script>

<script>
export default {
  data() {
    return {
      map: null
    }
  },
  props: {
    world: {
      type: Object,
      required: true
    }
  },
  mounted() {
    this.initMap()
  },
  methods: {
    initMap() {
      this.map = L.map(this.$refs.map, {
        center: [this.world.latitude, this.world.longitude],
        // center: [0, 0],
        zoom: 0,
        zoomControl: false,
        dragging: false,
        attributionControl: false
      })

      L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
      }).addTo(this.map)

      this.map.dragging.disable()
      this.map.touchZoom.disable()
      this.map.doubleClickZoom.disable()
      this.map.scrollWheelZoom.disable()
      this.map.boxZoom.disable()
      this.map.keyboard.disable()
      if (this.map.tap) this.map.tap.disable()
      this.$refs.map.style.cursor = 'default'

      var marker = new L.marker([this.world.latitude, this.world.longitude])

      var icon = L.icon({
        iconUrl: markerIcon,
        iconSize: [12, 20],
        iconAnchor: [6, 20]
      })
      marker.setIcon(icon)
      marker.addTo(this.map)
      marker.getElement().style.cursor = 'default'
    }
  }
}
</script>

<style scoped>
#map {
  width: 120px;
  height: 60px;
  /* margin: 0 5px; */
  border: 1px solid #333;
}
</style>
