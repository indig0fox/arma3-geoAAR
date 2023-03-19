<script setup>
import { Map, addProtocol, addControl, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";

import { mapState, mapWritableState } from "pinia";
import { useRecordingDataStore } from "@/stores/dataStore.js";

import { ref } from "vue";
import MainMap from "@/components/MainMap.vue";
import MapStateStatusBar from "@/components/MapStateStatusBar.vue";
import MiniMap from "@/components/MiniMap.vue";
import ClockComponent from "@/components/ClockComponent.vue";
import MapLeftPanel from "@/components/MapLeftPanel.vue";
import PlaybackManager from "@/components/PlaybackManager.vue";
import { ScaleLoader } from "vue3-spinner";
</script>

<template>
  <div
    id="main-page"
    class="window"
    @mouseenter="adjustActiveState"
    @mouseleave="adjustActiveState"
  >
    <div class="title-bar">
      <div class="title-bar-text">
        <img src="@/assets/img/terrain_icon.svg" class="title-bar-icon" />
        {{ $t("windowTitles.recordingViewer") }}
      </div>
      <!-- <div class="title-bar-text">
        <img src="@/assets/terrain_icon.svg" class="title-bar-icon" />Recording Viewer -
      </div> -->

      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
    </div>
    <div id="app-body" class="window-body">
      <!-- <div id="main-page-header"> -->
      <div
        id="main-page-header-window"
        class="window"
        @mouseenter="adjustActiveState"
        @mouseleave="adjustActiveState"
      >
        <div class="title-bar">
          <div class="title-bar-text">PENDING</div>
          <!-- <div class="title-bar-text">
        <img src="@/assets/terrain_icon.svg" class="title-bar-icon" />Recording Viewer -
      </div> -->

          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div id="app-body" class="window-body"></div>
      </div>
      <!-- </div> -->
      <div id="main-page-container">
        <div id="main-page-panel-left" class="panel-container">
          <div id="main-page-content-left" class="panel-content">
            <div
              id="player-list-window"
              class="window panel-container"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar">
                <div class="title-bar-text">
                  {{ $t("playerList.windowTitle") }}
                </div>

                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="player-list-body" class="window-body">
                <UnitList v-if="playbackInitialized" />
              </div>
            </div>
          </div>
          <div
            id="selected-unit-info-window"
            class="window panel-container"
            @mouseenter="adjustActiveState"
            @mouseleave="adjustActiveState"
          >
            <div class="title-bar">
              <div class="title-bar-text">
                {{ $t("playback.selectedUnit.windowTitle") }}
              </div>

              <div class="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div id="selected-unit-info-body" class="window-body">
              <!-- <UnitList v-if="playbackInitialized" /> -->
            </div>
          </div>
        </div>
        <div id="main-page-panel-center" class="panel-container">
          <div id="main-page-content-center" class="panel-content">
            <div
              id="map-container"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar">
                <div class="title-bar-text">
                  <img src="@/assets/img/terrain_icon.svg" class="title-bar-icon" />
                  {{ $t("mainMap.windowTitle") }}
                </div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="map-container-body" class="window-body">
                <MainMap :key="activeWorld" v-if="activeWorld" />
              </div>
              <div id="map-container-bottom">
                <MapStateStatusBar :key="activeWorld" v-if="activeWorld" />
              </div>
            </div>

            <div
              id="playback-container"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar">
                <div class="title-bar-text">
                  <img
                    src="@/assets/img/terrain_icon.svg"
                    class="title-bar-icon"
                  />Playback Manager
                </div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="playback-container-body" class="window-body">
                <PlaybackManager :key="mainMap" v-if="mapReady" />
              </div>
            </div>
          </div>
        </div>
        <div id="main-page-panel-right" class="panel-container">
          <div id="main-page-content-right" class="panel-content">
            <div
              id="minimap-window"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar inactive">
                <div class="title-bar-text">{{ $t("miniMap.windowTitle") }}</div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="minimap-window-body" class="window-body">
                <MiniMap :key="activeWorld" v-if="activeWorld" />
              </div>
            </div>
            <div
              id="events-window"
              class="window"
              @mouseenter="adjustActiveState"
              @mouseleave="adjustActiveState"
            >
              <div class="title-bar inactive">
                <div class="title-bar-text">{{ $t("eventsList.windowTitle") }}</div>
                <div class="title-bar-controls">
                  <button aria-label="Minimize"></button>
                  <button aria-label="Maximize"></button>
                  <button aria-label="Close"></button>
                </div>
              </div>
              <div id="events-window-body" class="window-body"></div>
            </div>
          </div>
        </div>
      </div>
      <!-- <div id="footer"> -->

      <!-- </div> -->
    </div>
    <div class="status-bar">
      <p class="status-bar-field" style="max-width: 128px">
        <ClockComponent />
        Running Maplibre v{{ maplibreVersion }}
      </p>
      <p class="status-bar-field" style="max-width: 128px">
        CursorPos: {{ mousePositionXY }}<br />
        Zoom: {{ currentZoom }} -- Pitch: {{ currentPitch }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapState, mapWritableState } from "pinia";
import { useRecordingDataStore } from "@/stores/dataStore.js";
import { usePlaybackDataStore } from "@/stores/playbackStore.js";
const showRecordingModal = ref(false);
import UnitList from "@/components/UnitList.vue";

export default {
  components: {
    MainMap,
    MiniMap,
    MapLeftPanel,
    ClockComponent,
    PlaybackManager,
    ScaleLoader,
    UnitList,
  },
  name: "RecordingViewer",
  data() {
    return {};
  },
  created() {
    if (!this.$route.query?.id) {
      this.$router.push({ name: "recordings" });
    }
  },
  mounted() {
    // console.log('mounted RecordingViewer')
  },
  computed: {
    ...mapState(useRecordingDataStore, [
      "mainMap",
      "activeRecording",
      "activeRecordingData",
      "activeRecordingReady",
      "playbackLoadingWorker",
      "viewBounds",
      "currentZoom",
      "currentPitch",
      "currentBearing",
      "mousePositionXY",
      "maplibreVersion",
      "mapReady",
    ]),
    ...mapState(useRecordingDataStore, ["activeWorld"]),
    ...mapState(usePlaybackDataStore, ["playbackInitialized"]),
  },
  methods: {
    adjustActiveState(e) {
      // get title-bar element beneath
      var titleBar = e.target.querySelector(".title-bar");
      if (e.type == "mouseenter") {
        titleBar.classList.remove("inactive");
      } else {
        titleBar.classList.add("inactive");
      }
    },
  },
};
</script>

<style scoped>
#main-page {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#main-page-container {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: row;
}

#app-body {
  width: auto;
  height: inherit;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}

#main-page-panel-left,
#main-page-panel-right {
  width: 35%;
}
#main-page-panel-center {
  width: 75%;
}

.panel-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  width: auto;
  height: 100%;
  /* background-color: lightsteelblue; */
}

.panel-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  width: auto;
  height: 100%;
  /* padding: 5px; */
  /* border: 5px outset mediumturquoise; */
}

#map-container,
#map-container-body,
#playback-container,
#playback-container-body {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* padding: 10px; */
}

#map-container {
  height: 100%;
}
#playback-container {
  height: 40%;
}

#minimap-window,
#events-window {
  min-height: 256px;
  max-height: 256px;

  width: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  /* gap: 5px; */
}
#minimap-window-body,
#events-window-body {
  height: 100%;
  width: auto;
  flex: 1;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 5px;
  justify-content: stretch;
}

#player-list-window {
  height: 100%;
}
#player-list-body {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  gap: 5px;
}
</style>
