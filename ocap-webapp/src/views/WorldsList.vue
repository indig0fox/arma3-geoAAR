<template>
  <div id="worlds">
    <h2
      style="
        padding: 10px;

        color: white;
        text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
      "
    >
      {{ $t('headings.availableWorlds.title') }}
    </h2>
    <div id="worlds-list" class="window-body">
      <WorldCard v-for="world in sortedWorlds" :key="world" :world="world" />
    </div>
    <div>
      <p id="footer-text">
        Map tiles for preview inserts provided by
        <a href="http://stamen.com">Stamen Design</a>, under
        <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by
        <a href="http://openstreetmap.org">OpenStreetMap</a>, under
        <a href="http://www.openstreetmap.org/copyright">ODbL</a>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/recordings.js'
</script>

<script>
import WorldCard from '../components/WorldCard.vue'

export default {
  name: 'WorldsList',
  data() {
    return {}
  },
  computed: {
    ...mapState(useRecordingDataStore, [
      'availableWorlds',
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePositionXY',
      'maplibreVersion'
    ]),
    sortedWorlds() {
      var sortedWorlds = []
      this.availableWorlds.forEach((world, key) => {
        sortedWorlds.push(world)
      })
      return sortedWorlds.sort((a, b) => {
        return a.displayName.localeCompare(b.displayName)
      })
    }
  },
  mounted() {},
  created() {},
  methods: {},
  components: { WorldCard }
}
</script>

<style>
#worlds {
  /* font-family: "Avenir", Helvetica, Arial, sans-serif; */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;

  background: url('@/assets/img/arma3_screenshot_20.jpg');
  border: 5px solid #000000;
}
#worlds-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  /* align-items: center; */
  justify-content: center;
  /* background: inherit; */
}
#footer-text {
  color: white;
  text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
  background: black;
  padding: 10px;
  font-style: italic;
}
#footer-text > a:link {
  color: lightseagreen;
  text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
}
#footer-text > a:visited {
  color: lightgreen;
  text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
}
#footer-text > a:hover {
  color: white;
  text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
}
#footer-text > a:active {
  color: white;
  text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
}
#footer-text > a:focus {
  color: white;
  text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
}
</style>
