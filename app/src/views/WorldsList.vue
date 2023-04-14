<template>
  <div id="worlds">
    <div id="worlds-list-container" class="window-body">
      <h3>Featured World</h3>

      <div id="featured-world">
        <WorldCard
          :v-if="availableWorlds?.get('brf_sumava')"
          :key="availableWorlds?.get('brf_sumava')"
          :world="availableWorlds?.get('brf_sumava')"
        >
          <template #titleSuffix
            >&nbsp;-&nbsp;<a
              href="https://steamcommunity.com/sharedfiles/filedetails/?id=2947655994"
              class="lightlink"
            >
              New release!
            </a>
          </template>
        </WorldCard>
      </div>

      <h3>
        {{ $t('headings.availableWorlds') }}
      </h3>

      <div id="worlds-list">
        <WorldCard v-for="world in sortedWorlds" :key="world" :world="world" />

        <p id="footer-text">
          Map tiles for preview inserts provided by
          <a href="http://stamen.com" class="lightlink">Stamen Design</a>, under
          <a href="http://creativecommons.org/licenses/by/3.0" class="lightlink">CC BY 3.0</a>. Data
          by <a href="http://openstreetmap.org" class="lightlink">OpenStreetMap</a>, under
          <a href="http://www.openstreetmap.org/copyright" class="lightlink">ODbL</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/dataStore.js'
</script>

<script>
import WorldCard from '../components/WorldCard.vue'

export default {
  name: 'WorldsList',
  created() {},
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
#worlds-list,
#featured-world {
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
</style>
