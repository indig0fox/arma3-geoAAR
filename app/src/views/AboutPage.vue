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
      <h4>Overview</h4>
      <p>
        This project is meant to be an all-in-one terrain explorer for Arma 3 terrains (worlds) and
        playback system for OCAP2 recording data. The core features planned include:
      </p>
      <ul>
        <li>List of terrains for which data has been rendered to include preview images</li>
        <li>Interactive map view with toggleable GIS analysis layers</li>
        <li>
          Interactive planning mode with ability to place, import, and export markers to Arma 3
        </li>
        <li>OCAP2 integration with statistics</li>
      </ul>
      <h4>Frontend</h4>
      <p>
        The web application you see here is built in
        <a href="https://vuejs.org/">Vue 3</a> with Javascript and HTML.
        <a href="https://github.com/jdan/98.css">98.css</a> serves as a CSS framework for most of
        the styling you see here.
        <a href="https://maplibre.org/projects/maplibre-gl-js/">MaplibreGL JS</a> is used for map
        rendering.
      </p>
      <h5>Functional</h5>
      <ul>
        <li>Worlds list with preview images</li>
        <li>World viewer</li>
        <li>Recordings list from OCAP2 backend</li>
      </ul>
      <h5>Planned</h5>
      <ul>
        <li>OCAP2 playback viewer</li>
        <li>OCAP2 statistics</li>
      </ul>
      <h4>Backend</h4>
      <p>
        The backend consists of static hosting for world data and the Golang OCAP2 server for
        hosting recordings.
      </p>
      <h5>World Data and Mapping</h5>
      <p>
        All world data was exported from Arma 3 using
        <a href="https://github.com/gruppe-adler/grad_meh">grad_meh</a> and converted using a custom
        Python application running in Docker (not yet released). This generates tiled vector data in
        <a href="https://github.com/protomaps/PMTiles">PMTiles</a> format to be fed into
        <a href="https://docs.mapbox.com/mapbox-gl-js/style-spec/">Mapbox GL styles</a>
        that can be used in web mapping software.
      </p>
      <p>
        Metadata and styles from processed worlds is stored at
        <a href="https://styles.ocap2.com/">styles.ocap2.com</a> and used with
        <a href="https://maplibre.org/projects/maplibre-gl-js/">MaplibreGL JS</a> for display. The
        world data itself is stored at <a href="https://tiles.ocap2.com/">tiles.ocap2.com</a>. and
        retrieved using the <a href="https://github.com/protomaps/PMTiles">PMTiles</a> protocol.
      </p>
      <h4>Closing</h4>
      <p>
        This project is a work in progress! If you have any suggestions or things you'd like to see,
        please contact me.
      </p>
      <p>
        -- Indigo
        <br />
        <a href="https://indigofox.dev">https://indigofox.dev</a>
        <a href="https://github.com/indig0fox/arma3-geoAAR">Github</a>
      </p>
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
  height: 100%;
  width: auto;

  top: 0;
  left: 0;
}
</style>
