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
        return a.meta.displayName.localeCompare(b.meta.displayName)
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
</style>
