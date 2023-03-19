<template>
  <div id="layer-controls">
    <fieldset id="style-button-container">
      <legend>{{ $t("mainMap.layerControlsTitle") }}</legend>
      <div class="field-row">
        <input
          type="checkbox"
          id="showColorRelief"
          v-model="showColorRelief"
          @change="toggleColorRelief"
        />
        <label for="showColorRelief">{{ $t("mainMap.colorRelief") }}</label>
      </div>

      <div class="field-row">
        <input
          type="checkbox"
          id="showSatellite"
          v-model="showSatellite"
          @change="toggleSatellite"
        />
        <label for="showSatellite">{{ $t("mainMap.satellite") }}</label>
      </div>

      <div class="field-row">
        <input
          type="checkbox"
          id="showHillshade"
          v-model="showHillshade"
          @change="toggleHillshade"
        />
        <label for="showHillshade">{{ $t("mainMap.hillshade") }}</label>
      </div>

      <!-- hillshade opacity slider -->
      <div class="field-row">
        <label for="hillshadeOpacity">
          {{ $t("mainMap.hillshadeOpacity") }}
        </label>
      </div>
      <div class="field-row">
        <input
          id="hillshadeOpacity"
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model.number="hillshadeOpacity"
          @input="setHillshadeOpacity"
        />
      </div>

      <div class="field-row">
        <input
          type="checkbox"
          id="showContourLines"
          v-model="showContourLines"
          @change="toggleContourLines"
        />
        <label for="showContourLines">{{ $t("mainMap.contourLines") }}</label>
      </div>

      <div class="field-row">
        <input
          type="checkbox"
          id="showTerrain"
          v-model="showTerrain"
          @change="toggleTerrain"
        />
        <label for="showTerrain">{{ $t("mainMap.3dTerrain") }}</label>
      </div>

      <div class="field-row">
        <input
          type="checkbox"
          id="showHouseExtrusion"
          v-model="showHouseExtrusion"
          @change="toggleHouseExtrusion"
        />
        <label for="showHouseExtrusion">{{ $t("mainMap.3dBuildings") }}</label>
      </div>

      <div class="field-row">
        <input
          type="checkbox"
          id="showGridlines"
          v-model="showGridlines"
          @change="toggleGridlines"
        />
        <label for="showGridlines">{{ $t("mainMap.gridlines") }}</label>
      </div>
    </fieldset>

    <fieldset>
      <legend>{{ $t("mainMap.mapFOV.legend") }}</legend>

      <div class="field-row">
        <button
          @click="setMapFOV('auto')"
          :disabled="this.mainMap.transform._fov === this.mapFOV['auto']"
        >
          {{ $t("mainMap.mapFOV.auto") }}
        </button>
      </div>
      <div class="field-row">
        <button
          @click="setMapFOV('wide')"
          :disabled="this.mainMap.transform._fov === this.mapFOV['wide']"
        >
          {{ $t("mainMap.mapFOV.wide") }}
        </button>
      </div>
    </fieldset>
  </div>
</template>

<script>
export default {
  name: "LayerControls",
  props: {
    mainMap: Object,
    required: true,
  },
  mounted() {
    this.mapFOV.auto = this.mainMap.transform._fov;
  },
  data() {
    return {
      showColorRelief: false,
      showHillshade: true,
      hillshadeOpacity: 0.5,
      showTerrain: false,
      showSatellite: false,
      showHouseExtrusion: true,
      showContourLines: true,
      showGridlines: false,
      mapFOV: {
        auto: 0.6,
        wide: 1,
      },
    };
  },
  computed: {},
  methods: {
    resetTerrain: function () {
      if (this.mainMap.getTerrain()) {
        this.mainMap.setTerrain();
        this.mainMap.setTerrain({ source: "heightmap" });
        this.toggleTerrain();
      }
    },
    toggleColorRelief: function () {
      if (this.showColorRelief) {
        this.mainMap.setLayoutProperty("color-relief", "visibility", "visible");
      } else {
        this.mainMap.setLayoutProperty("color-relief", "visibility", "none");
      }
      this.resetTerrain();
    },
    toggleHillshade: function () {
      if (this.showHillshade) {
        this.mainMap.setLayoutProperty("hillshade", "visibility", "visible");
      } else {
        this.mainMap.setLayoutProperty("hillshade", "visibility", "none");
      }
      this.resetTerrain();
    },
    setHillshadeOpacity: function () {
      this.mainMap.setPaintProperty("hillshade", "raster-opacity", this.hillshadeOpacity);
    },
    toggleTerrain: function () {
      if (this.showTerrain) {
        this.mainMap.setTerrain({ source: "heightmap" });
      } else {
        this.mainMap.setTerrain();
      }
    },
    toggleSatellite: function () {
      if (this.showSatellite) {
        this.mainMap.setLayoutProperty("satellite", "visibility", "visible");
      } else {
        this.mainMap.setLayoutProperty("satellite", "visibility", "none");
      }
      this.resetTerrain();
    },
    toggleHouseExtrusion: function () {
      if (this.showHouseExtrusion) {
        this.mainMap.setLayoutProperty("house-extrusion", "visibility", "visible");
      } else {
        this.mainMap.setLayoutProperty("house-extrusion", "visibility", "none");
      }
      this.resetTerrain();
    },
    toggleContourLines: function () {
      if (this.showContourLines) {
        this.mainMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith("contours")) {
            this.mainMap.setLayoutProperty(layer.id, "visibility", "visible");
          }
        });
      } else {
        this.mainMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith("contours")) {
            this.mainMap.setLayoutProperty(layer.id, "visibility", "none");
          }
        });
      }
      this.resetTerrain();
    },
    toggleGridlines: function () {
      if (this.showGridlines) {
        this.mainMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith("grid")) {
            this.mainMap.setLayoutProperty(layer.id, "visibility", "visible");
          }
        });
      } else {
        this.mainMap.getStyle().layers.forEach((layer) => {
          if (layer.id.startsWith("grid")) {
            this.mainMap.setLayoutProperty(layer.id, "visibility", "none");
          }
        });
      }
      this.resetTerrain();
    },
    setMapFOV: function (mode) {
      this.mainMap.transform._fov = this.mapFOV[mode];
      console.log(this.mainMap.transform._fov);
    },
  },
};
</script>

<style scoped>
#layer-controls {
  /* background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.3); */
  /* font-family: 'Roboto', 'sans-serif'; */
  position: absolute;
  top: 5px;
  left: 8px;
  height: fit-content;
  width: 110px;
  background-color: #c0c0c0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.style-option {
  align-items: center;
  display: flex;
  padding: 5px;
}

.style-option > label {
  /* font-size: 10px; */
  /* font-family: 'Arial', 'sans-serif'; */
}
</style>
