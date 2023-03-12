<template>
  <div id="worlds">
    <h4
      style="
        padding: 10px;

        color: white;
        text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
      "
    >
      Available Worlds
    </h4>
    <div id="worlds-list" class="window-body">
      <WorldCard v-for="world in sortedWorlds" :key="world" :world="world" />
    </div>
  </div>
</template>

<script>
import WorldCard from '../components/WorldCard.vue'

export default {
  name: 'WorldsList',
  data() {
    return {
      message: 'Hello World!',
      worlds: []
    }
  },
  computed: {
    sortedWorlds() {
      return this.worlds.slice().sort((a, b) => {
        return a.meta.displayName.localeCompare(b.meta.displayName)
      })
    }
  },
  mounted() {},
  created() {
    const fetchWorlds = async () => {
      const response = await fetch('https://styles.ocap2.com/worlds.json')
      const data = await response.json()
      var worlds = []
      Object.keys(data.worlds).forEach(function (key) {
        var item = data.worlds[key]
        item.preview = 'https://styles.ocap2.com/previews/' + key + '_256px.png'
        worlds.push(data.worlds[key])
      })
      this.worlds = worlds
      // console.log(this.worlds);
    }
    fetchWorlds()
  },
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

  background: url('@/assets/arma3_screenshot_20.jpg');
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
