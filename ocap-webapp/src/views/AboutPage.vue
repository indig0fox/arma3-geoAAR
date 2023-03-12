<template>
  <div id="about-window" class="window">
    <div class="title-bar">
      <div class="title-bar-text">About This Project</div>
      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body">
      <p>
        This is a simple viewer for Arma 3 worlds. It uses the
        <a href="https://styles.ocap2.com/worlds.json">worlds.json</a> file from
        <a href="https://styles.ocap2.com/">styles.ocap2.com</a> to display the available worlds and
        their previews.
      </p>
      <p>
        The mapping technology is
        <a href="https://maplibre.org/projects/maplibre-gl-js/">Maplibre GL JS</a>
        with vector tiles retrieved from static site hosting in
        <a href="https://github.com/protomaps/PMTiles">PMTiles</a> format.
      </p>
      <p>
        This project is a work in progress! If you have any suggestions or find any bugs, please
        contact me.
      </p>
      <p>
        Indigo
        <br />
        <a href="https://indigofox.dev">https://indigofox.dev</a>
      </p>

      <p><a href="https://github.com/jdan/98.css">98.css</a> is used for the UI.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutPage',
  components: {},
  data() {
    return {}
  },
  computed: {},
  mounted() {},
  methods: {}
}
</script>

<style>
#about-window {
  /* font-size: 1.5em; */
  height: 45%;
  width: 45%;
  text-align: center;

  /* center on page */
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
