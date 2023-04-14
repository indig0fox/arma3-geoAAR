<template>
  <div>
    <ScaleLoader v-show="!activeRecordingReady" :color="'#02108a'" />
    <div id="panel-rows" v-if="activeRecordingReady">
      <!-- <div id="panel-rows"> -->
      <div id="panel-row-1" class="panel-row">
        <div id="panel-column-left" class="panel-column">
          <p>Status: {{ status }}</p>
          <div id="playback-speed-container">
            <fieldset>
              <legend>{{ $t("playback.controls.speed.legend") }}</legend>

              <div class="field-row">
                <label class="slider-label">
                  {{ $t("playback.playbackSpeed") }}:
                  {{ parseFloat(playbackSpeed).toFixed(1) }} x
                  <br />
                  {{ $t("playback.targetFrameRate") }}:
                  {{ parseFloat(fpsTarget).toFixed(2) }} fps
                  <br />
                  {{ $t("playback.actualFrameRate") }}:
                  {{ parseFloat(fpsNormal).toFixed(2) }} fps
                  <br />
                  <span
                    style="color: gray; display: contents"
                    v-show="fpsNormal < fpsTarget"
                  >
                    {{ $t("playback.skippingFrames") }}
                  </span>
                  <span
                    style="color: gray; display: contents"
                    v-show="fpsNormal >= fpsTarget"
                  >
                    {{ $t("playback.notSkippingFrames") }}
                  </span>
                </label>
              </div>
              <div class="field-row">
                <input
                  id="slider-playback-speed"
                  type="range"
                  v-model="playbackSpeed"
                  :min="0.5"
                  :max="80.0"
                  :step="0.5"
                  :show-tooltip="true"
                  list="tickmarks"
                />
                <!-- define ticks -->
                <datalist id="tickmarks">
                  <option>1.0</option>
                  <option>10.0</option>
                  <option>30.0</option>
                  <option>60.0</option>
                </datalist>
              </div>
            </fieldset>
          </div>
        </div>
        <div id="panel-column-center" class="panel-column">
          <div id="playback-controls-container">
            <fieldset id="playback-controls">
              <legend>{{ $t("playback.controls.action.legend") }}</legend>
              <div class="field-row">
                <button @click="startPlayback" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.action.play") }}
                </button>

                <button @click="stopPlayback" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.action.stop") }}
                </button>
              </div>
              <div class="field-row">
                <button @click="stepBack" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.action.stepBack") }}
                </button>
                <button @click="stepForward" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.action.stepForward") }}
                </button>
              </div>
              <div class="field-row">
                <button @click="playbackSpeed = 1.0" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.speed.real") }}
                </button>
                <button @click="playbackSpeed = 10" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.speed.normal", { speed: 10 }) }}
                </button>
              </div>
              <div class="field-row">
                <button @click="playbackSpeed = 30" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.speed.fast", { speed: 30 }) }}
                </button>
                <button @click="playbackSpeed = 60" :disabled="!playbackInitialized">
                  {{ $t("playback.controls.speed.veryFast", { speed: 60 }) }}
                </button>
              </div>
            </fieldset>
          </div>
        </div>
        <div id="panel-column-right" class="panel-column">
          <fieldset id="style-button-container">
            <legend>{{ $t("playback.controls.visible.legend") }}</legend>
            <div class="field-row">
              <input
                type="checkbox"
                id="showUnitMarkers"
                v-model="showUnitMarkers"
                :disabled="!playbackInitialized"
              />
              <label for="showUnitMarkers">{{
                $t("playback.controls.visible.showUnitMarkers")
              }}</label>
            </div>
            <div class="field-row">
              <input
                type="checkbox"
                id="showUnitLabels"
                v-model="showUnitLabels"
                :disabled="!playbackInitialized"
              />
              <label for="showUnitLabels">{{
                $t("playback.controls.visible.showUnitLabels")
              }}</label>
            </div>
            <div class="field-row">
              <input
                type="checkbox"
                id="showAILabels"
                v-model="showAILabels"
                :disabled="!playbackInitialized"
              />
              <label for="showAILabels">{{
                $t("playback.controls.visible.showAILabels")
              }}</label>
            </div>
            <div class="field-row">
              <input
                type="checkbox"
                id="showVehicleMarkers"
                v-model="showVehicleMarkers"
                :disabled="!playbackInitialized"
              />
              <label for="showVehicleMarkers">{{
                $t("playback.controls.visible.showVehicleMarkers")
              }}</label>
            </div>
            <div class="field-row">
              <input
                type="checkbox"
                id="showVehicleLabels"
                v-model="showVehicleLabels"
                :disabled="!playbackInitialized"
              />
              <label for="showVehicleLabels">{{
                $t("playback.controls.visible.showVehicleLabels")
              }}</label>
            </div>
          </fieldset>
        </div>
      </div>
      <div id="panel-row-bottom" class="panel-row">
        <div id="playback-frame-container">
          <label class="slider-label">
            {{ $t("playback.currentFrame") }}: {{ playbackCurrentFrame }} /
            {{ activeRecordingData?.endFrame - 1 || 0 }}
            <br />
            {{ $t("playback.currentTimestamp") }}: {{ playbackCurrentTimestamp }} /
            {{ recordingDuration }}
          </label>
          <input
            id="slider-playback-frame"
            ref="sliderPlaybackFrame"
            type="range"
            v-model.number="playbackCurrentFrame"
            :min="0"
            :max="activeRecordingData?.endFrame - 1 || 0"
            :step="1"
            :show-tooltip="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapWritableState } from "pinia";
import { useRecordingDataStore } from "@/stores/dataStore.js";
import { usePlaybackDataStore } from "@/stores/playbackStore.js";

import * as turf from "@turf/turf";

import { loadEntityData } from "@/playbackNew/loading.js";
import * as replayUtils from "@/playbackNew/utils.js";
import { entityColors } from "@/arma3data/definitions.js";

import { ScaleLoader } from "vue3-spinner";

const recordingData = useRecordingDataStore();
const playbackData = usePlaybackDataStore();

export default {
  components: {
    ScaleLoader,
  },
  name: "PlaybackManager",
  data() {
    return {
      status: "Recording Downloaded",
      animationFrameId: null,
      lastUpdate: 0,
      fpsFrames: 0,
      fpsStartTime: performance.now(),
      fpsNormal: 0,
    };
  },
  async created() {
    usePlaybackDataStore().$reset();
    this.activeRecordingReady = false;
  },
  async mounted() {
    await this.getRecordingData()
      .catch((err) => {
        console.error(err);
      })
      .then(() => {
        this.loadRecordingData();
      })
      .then(() => {
        if (this.$route.query.frame) {
          this.playbackCurrentFrame = parseInt(this.$route.query.frame);
        } else {
          this.playbackCurrentFrame = 1;
        }

        return Promise.resolve();
      })
      .catch((err) => {
        console.error(err);
      });
    this.renderLoop();
    return true;
  },
  unmounted() {
    this.stopPlayback();
    window.cancelAnimationFrame(usePlaybackDataStore().playbackRenderId);
    usePlaybackDataStore().$reset();
  },
  destroyed() {},
  computed: {
    ...mapState(useRecordingDataStore, ["mainMap"]),
    ...mapWritableState(useRecordingDataStore, [
      "activeRecordingReady",
      "activeRecording",
      "activeRecordingData",
    ]),

    ...mapState(useRecordingDataStore, ["activeWorld", "availableRecordings"]),
    ...mapState(useRecordingDataStore, [
      "viewBounds",
      "currentZoom",
      "currentPitch",
      "currentBearing",
      "mousePositionXY",
      "maplibreVersion",
      "mapReady",
      "mapHash",
      "playbackLoadingWorker",
    ]),
    ...mapWritableState(usePlaybackDataStore, [
      "playbackInitialized",
      "playbackRenderId",
      "playbackNextFrame",
      "playbackEntities",
      "playbackEntitiesGeoJSON",
      "playbackCurrentFrame",
      "playbackCurrentTimestamp",
      "playbackRunning",
      "playbackSpeed",
      "showUnitMarkers",
      "showUnitLabels",
      "showAILabels",
      "showVehicleMarkers",
      "showVehicleLabels",
    ]),
    worldsize() {
      return this.activeWorld.worldSize;
    },
    playbackCurrentTimestamp() {
      if (!this.activeRecordingReady) return 0;
      if (
        !this.activeRecordingData ||
        !this.playbackCurrentFrame ||
        this.playbackCurrentFrame < 1 ||
        this.playbackCurrentFrame > this.activeRecordingData.endFrame
      )
        return 0;
      // convert current frame to timestamp based on capture delay (seconds) and end frame
      const timeInSeconds =
        this.playbackCurrentFrame * this.activeRecordingData.captureDelay;
      // console.log("playbackCurrentTimestamp", "timeInSeconds", timeInSeconds);

      // convert to timestamp
      const timestamp = replayUtils.secondsToTimestamp(timeInSeconds);
      // console.log("playbackCurrentTimestamp", "timestamp", timestamp);
      return timestamp;
    },
    fpsTarget() {
      if (!this.activeRecordingReady) return 0;
      return (1 / this.activeRecordingData.captureDelay) * this.playbackSpeed;
    },
    recordingDuration() {
      if (!this.activeRecordingReady) return 0;
      if (
        !this.activeRecordingData ||
        !this.playbackCurrentFrame ||
        this.playbackCurrentFrame < 1 ||
        this.playbackCurrentFrame > this.activeRecordingData.endFrame
      )
        return 0;
      const timeInSeconds =
        this.activeRecordingData.endFrame * this.activeRecordingData.captureDelay;
      // console.log("recordingDuration", "timeInSeconds", timeInSeconds);
      const timestamp = replayUtils.secondsToTimestamp(timeInSeconds);
      return timestamp;
    },
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
    async getRecordingData() {
      if (this.$route.query.id) {
        // * load recording from provided ID
        this.activeRecordingReady = false;
        this.status = "Loading Recording";

        if (this.$route.query.id === "local") {
        }

        // console.log(this.availableRecordings)
        var recordingObj = this.availableRecordings.get(parseInt(this.$route.query.id));

        if (recordingObj) {
          // console.log(recordingObj)
          this.activeRecording = recordingObj;
          await useRecordingDataStore()
            .getRecordingData(recordingObj)
            .then(() => {
              this.activeRecordingReady = true;
              this.status = "Recording Downloaded";
            })
            .catch((error) => {
              this.activeRecordingData = null;
              alert("Error loading recording data\n" + error);
            });
        } else {
          this.activeRecording = null;
          alert("Recording id " + this.$route.query.id + " not found");
        }
      } else {
        this.activeRecording = null;
      }
    },
    async loadRecordingData() {
      console.log("Initializing replay system...");

      this.status = "Loading entity data";

      await loadEntityData(
        this.activeRecordingData.entities,
        this.activeRecordingData.endFrame
      ).then((entities) => {
        this.playbackEntities = entities;
        // console.log(entities)
        this.status = "Ready";
        this.playbackInitialized = true;
      });

      return Promise.resolve();

      // load entities
      // var msgObj = {
      //   cmd: "loadEntityData",
      //   entities: JSON.stringify(this.activeRecordingData.entities),
      // };
      // this.playbackLoadingWorker.postMessage(msgObj);

      // loadEntityData(this.activeRecordingData.entities).then((entities) => {
      //   this.playbackEntities = entities;

      //   // console.log('Loaded entities & bound map')
      //   this.status = "Precaching positions";

      //   // wait until all entities have positionsReady
      //   var entitiesReady = false;
      //   var entitiesReadyInterval = setInterval(() => {
      //     var entitiesReady = Object.values(this.playbackEntities).every(
      //       (entity) => entity.positionsReady
      //     );
      //     // get count of entities with positionsReady
      //     // var entitiesReadyCount = Object.values(this.playbackEntities).filter(
      //     //   (entity) => entity.positionsReady
      //     // ).length;
      //     if (entitiesReady) {
      //       clearInterval(entitiesReadyInterval);
      //       this.status = "Precaching done";
      //       this.playbackInitialized = true;
      //       this.renderLoop();
      //     }
      //   }, 1500);
      // });
    },

    sliderChangeFrame(e) {
      // console.log('Slider changed frame', e.target.value)
      this.playbackCurrentFrame = parseInt(e.target.value);
      if (this.playbackCurrentFrame % 5 == 0) {
        this.$router.replace({
          query: { ...this.$route.query, frame: this.playbackCurrentFrame },
        });
        // console.log('updated hash')
      }
    },

    startPlayback() {
      if (this.playbackRunning) return;
      console.log("Starting playback", this.playbackCurrentFrame);
      this.playbackRunning = true;
      this.status = "Playing";
      // console.log('Starting playback')
      // start playback loop
      this.playbackLoop();
    },

    stopPlayback() {
      this.playbackRunning = false;
      this.status = "Stopped";
      if (this.playbackNextFrame) {
        clearTimeout(this.playbackNextFrame);
        this.playbackNextFrame = null;
      }
      // console.log('Stopping playback')
    },

    stepBack() {
      // console.log('Stepping backward')
      this.playbackCurrentFrame -= 1;
    },

    stepForward() {
      // console.log('Stepping forward')
      this.playbackCurrentFrame += 1;
    },

    renderLoop(timestamp) {
      if (!usePlaybackDataStore().playbackInitialized) {
        usePlaybackDataStore().playbackRenderId = window.cancelAnimationFrame(
          this.renderLoop
        );
        return;
      }

      // only update every 0.25s
      if (timestamp - this.lastUpdate < 250) {
        return (usePlaybackDataStore().playbackRenderId = window.requestAnimationFrame(
          this.renderLoop
        ));
      }

      try {
        this.updateEntities();
      } catch (e) {
        console.warn("Error updating entities", e);
      }

      // calculate FPS
      this.calculateFPSNormal();

      // request next frame
      return (usePlaybackDataStore().playbackRenderId = window.requestAnimationFrame(
        this.renderLoop
      ));
    },

    calculateFPSNormal() {
      var t = performance.now();
      var dt = t - this.fpsStartTime;

      // if elapsed time is greater than 1s
      if (dt > 1000) {
        // calculate the frames drawn over the period of time
        this.fpsNormal = (this.fpsFrames * 1000) / dt;
        // and restart the values
        this.fpsFrames = 0;
        this.fpsStartTime = t;
      }
      this.fpsFrames++;
    },

    playbackLoop() {
      // console.log('Playback loop')
      // check if playback is running
      if (
        !playbackData.playbackRunning ||
        playbackData.playbackCurrentFrame >= this.activeRecordingData.endFrame
      ) {
        this.stopPlayback();
        return;
      }

      // if fps is too low, skip frames to catch up to accurate render time
      if (this.fpsNormal < this.fpsTarget && this.fpsNormal > 0) {
        // console.log('Skipping frames')
        this.playbackCurrentFrame += Math.floor(this.fpsTarget / this.fpsNormal);
      } else {
        this.playbackCurrentFrame += 1;
      }
      // wait for next frame
      this.playbackNextFrame = setTimeout(this.playbackLoop, 1000 / this.fpsTarget);

      return;
    },

    updateEntities() {
      // iterate through playbackUnits object
      for (var unitId in this.playbackEntities) {
        // console.log("Updating entity", unitId);
        var unit = this.playbackEntities[unitId];
        unit.updateAtFrame(this.playbackCurrentFrame);
      }
    },
  },
  watch: {
    playbackCurrentFrame: function (newVal, oldVal) {
      if (newVal % 5 != 0) return;
      // console.log('Playback frame changed', newVal, oldVal)
      this.$router.replace({
        query: { ...this.$route.query, frame: newVal },
        hash: this.$route.hash,
      });
    },
  },
};
</script>

<style scoped>
#panel-rows {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
}

.panel-row {
  width: auto;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.panel-column {
  width: 100%;
  height: fit-content;
  display: flex;
  flex-direction: column;
}

.field-row > button {
  white-space: nowrap;
}

#playback-speed-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  height: 70px;
}

#playback-frame-container {
  width: auto;
  /* height: 70px; */
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #000;
  padding: 5px;
}

#playback-speed-container > label,
#playback-frame-container > label {
}

#playback-frame-container {
  width: 100%;
}
</style>
