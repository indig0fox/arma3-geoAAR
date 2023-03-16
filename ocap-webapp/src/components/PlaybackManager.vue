<template>
  <div id="panel-rows">
    <div id="panel-row-1" class="panel-row">
      <div id="panel-column-left" class="panel-column">
        <p>Status: {{ status }}</p>
        <div id="playback-speed-container">
          <fieldset id="style-button-container">
            <legend>{{ $t('playback.controls.speed.legend') }}</legend>

            <div class="field-row">
              <label class="slider-label">
                {{ $t('playback.playbackSpeed') }}: {{ parseFloat(playbackSpeed).toFixed(1) }} x
                <br />
                {{ $t('playback.targetFrameRate') }}: {{ parseFloat(fpsTarget).toFixed(2) }} fps
                <br />
                {{ $t('playback.actualFrameRate') }}: {{ parseFloat(fpsNormal).toFixed(2) }} fps
                <br />
                <span style="color: gray; display: contents" v-show="fpsNormal < fpsTarget">
                  {{ $t('playback.skippingFrames') }}
                </span>
                <span style="color: gray; display: contents" v-show="fpsNormal >= fpsTarget">
                  {{ $t('playback.notSkippingFrames') }}
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
            <legend>{{ $t('playback.controls.action.legend') }}</legend>
            <div class="field-row">
              <button @click="startPlayback" :disabled="!playbackInitialized">
                {{ $t('playback.controls.action.play') }}
              </button>

              <button @click="stopPlayback" :disabled="!playbackInitialized">
                {{ $t('playback.controls.action.stop') }}
              </button>
            </div>
            <div class="field-row">
              <button @click="stepBack" :disabled="!playbackInitialized">
                {{ $t('playback.controls.action.stepBack') }}
              </button>
              <button @click="stepForward" :disabled="!playbackInitialized">
                {{ $t('playback.controls.action.stepForward') }}
              </button>
            </div>
            <div class="field-row">
              <button @click="playbackSpeed = 1.0" :disabled="!playbackInitialized">
                {{ $t('playback.controls.speed.real') }}
              </button>
              <button @click="playbackSpeed = 10" :disabled="!playbackInitialized">
                {{ $t('playback.controls.speed.normal', { speed: 10 }) }}
              </button>
            </div>
            <div class="field-row">
              <button @click="playbackSpeed = 30" :disabled="!playbackInitialized">
                {{ $t('playback.controls.speed.fast', { speed: 30 }) }}
              </button>
              <button @click="playbackSpeed = 60" :disabled="!playbackInitialized">
                {{ $t('playback.controls.speed.veryFast', { speed: 60 }) }}
              </button>
            </div>
          </fieldset>
        </div>
      </div>
      <div id="panel-column-right" class="panel-column">
        <fieldset id="style-button-container">
          <legend>{{ $t('playback.controls.visible.legend') }}</legend>
          <div class="field-row">
            <input
              type="checkbox"
              id="showUnitMarkers"
              v-model="showUnitMarkers"
              :disabled="!playbackInitialized"
            />
            <label for="showUnitMarkers">{{
              $t('playback.controls.visible.showUnitMarkers')
            }}</label>
          </div>
          <div class="field-row">
            <input
              type="checkbox"
              id="showUnitLabels"
              v-model="showUnitLabels"
              :disabled="!playbackInitialized"
            />
            <label for="showUnitLabels">{{ $t('playback.controls.visible.showUnitLabels') }}</label>
          </div>
          <div class="field-row">
            <input
              type="checkbox"
              id="showAILabels"
              v-model="showAILabels"
              :disabled="!playbackInitialized"
            />
            <label for="showAILabels">{{ $t('playback.controls.visible.showAILabels') }}</label>
          </div>
          <div class="field-row">
            <input
              type="checkbox"
              id="showVehicleMarkers"
              v-model="showVehicleMarkers"
              :disabled="!playbackInitialized"
            />
            <label for="showVehicleMarkers">{{
              $t('playback.controls.visible.showVehicleMarkers')
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
              $t('playback.controls.visible.showVehicleLabels')
            }}</label>
          </div>
        </fieldset>
      </div>
    </div>
    <div id="panel-row-bottom" class="panel-row">
      <div id="playback-frame-container">
        <label class="slider-label">
          {{ $t('playback.currentFrame') }}: {{ playbackCurrentFrame }} /
          {{ activeRecordingData.endFrame }}
          <br />
          {{ $t('playback.currentTimestamp') }}: {{ playbackCurrentTimestamp }} /
          {{ recordingDuration }}
        </label>
        <input
          id="slider-playback-frame"
          ref="sliderPlaybackFrame"
          type="range"
          v-model="playbackCurrentFrame"
          @input="sliderChangeFrame"
          :min="0"
          :max="activeRecordingData.endFrame"
          :step="1"
          :show-tooltip="true"
        />
      </div>
    </div>
  </div>
</template>


<script>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/dataStore.js'
import { usePlaybackDataStore } from '@/stores/playbackStore.js'

import * as turf from '@turf/turf'

import { loadEntityData } from '@/playbackNew/loading.js'
import * as replayUtils from '@/playbackNew/utils.js'
import { entityColors } from '@/arma3data/definitions.js'

const recordingData = useRecordingDataStore()

export default {
  components: {},
  name: 'PlaybackManager',
  data() {
    return {
      status: 'Recording Downloaded',
      animationFrameId: null,
      lastUpdate: 0,
      fpsFrames: 0,
      fpsStartTime: performance.now(),
      fpsNormal: 0
    }
  },
  created() {},
  mounted() {
    this.loadRecordingData()
    if (this.$route.query.frame) {
      this.playbackCurrentFrame = parseInt(this.$route.query.frame)
    }
    // this.stepForward()
    // this.startPlayback()
  },
  unmounted() {
    this.stopPlayback()
    window.cancelAnimationFrame(usePlaybackDataStore().playbackRenderId)
    usePlaybackDataStore().$reset()
  },
  destroyed() {},
  computed: {
    ...mapState(useRecordingDataStore, ['mainMap', 'activeRecording', 'activeRecordingData']),
    ...mapState(useRecordingDataStore, ['activeWorld']),
    ...mapState(useRecordingDataStore, [
      'viewBounds',
      'currentZoom',
      'currentPitch',
      'currentBearing',
      'mousePositionXY',
      'maplibreVersion'
    ]),
    ...mapWritableState(usePlaybackDataStore, [
      'playbackInitialized',
      'playbackRenderId',
      'playbackEntities',
      'playbackEntitiesGeoJSON',
      'playbackCurrentFrame',
      'playbackCurrentTimestamp',
      'playbackRunning',
      'playbackSpeed',
      'showUnitMarkers',
      'showUnitLabels',
      'showAILabels',
      'showVehicleMarkers',
      'showVehicleLabels'
    ]),
    worldsize() {
      return this.activeWorld.worldSize
    },
    playbackCurrentTimestamp() {
      if (!this.activeRecordingData) return 0
      // convert current frame to timestamp based on capture delay (seconds) and end frame
      const timeInSeconds = this.playbackCurrentFrame * this.activeRecordingData.captureDelay
      // convert to timestamp
      const timestamp = replayUtils.secondsToTimestamp(timeInSeconds)
      return timestamp
    },
    fpsTarget() {
      if (!this.activeRecordingData) return 0
      return (1 / this.activeRecordingData.captureDelay) * this.playbackSpeed
    },
    recordingDuration() {
      if (!this.activeRecordingData) return 0
      const timeInSeconds =
        this.activeRecordingData.endFrame * this.activeRecordingData.captureDelay
      const timestamp = replayUtils.secondsToTimestamp(timeInSeconds)
      return timestamp
    }
  },
  methods: {
    adjustActiveState(e) {
      // get title-bar element beneath
      var titleBar = e.target.querySelector('.title-bar')
      if (e.type == 'mouseenter') {
        titleBar.classList.remove('inactive')
      } else {
        titleBar.classList.add('inactive')
      }
    },
    loadRecordingData() {
      console.log('Initializing replay system...')

      this.playbackEntities = loadEntityData(this.activeRecordingData.entities)

      // get bbox of all unit positions on frame 0 and fit map to it
      var selectFrom = Object.values(this.playbackEntities)
      // console.log(selectFrom)
      var points = selectFrom
        .map((unit) => unit.position)
        .map((position) => {
          return turf.point([position[0], position[1]])
        })
      // console.log(points)
      var bbox = turf.bbox(turf.featureCollection(points))
      // console.log(bbox)
      // this.mainMap.fitBounds(bbox, { padding: 10 })

      console.log('Loaded entities & bound map')
      this.status = 'Initialized'
      this.playbackInitialized = true
      this.renderLoop()
    },

    sliderChangeFrame(e) {
      // console.log('Slider changed frame', e.target.value)
      this.playbackCurrentFrame = parseInt(e.target.value)
      if (this.playbackCurrentFrame % 5 == 0) {
        this.$router.replace({
          query: { ...this.$route.query, frame: this.playbackCurrentFrame }
        })
        // console.log('updated hash')
      }
    },

    async startPlayback() {
      this.playbackRunning = true
      this.status = 'Playing'
      // console.log('Starting playback')
      // start playback loop
      this.playbackLoop()
    },

    async stopPlayback() {
      this.playbackRunning = false
      this.status = 'Stopped'
      // console.log('Stopping playback')
    },

    async stepBack() {
      // console.log('Stepping backward')
      this.playbackCurrentFrame -= 1
    },

    async stepForward() {
      // console.log('Stepping forward')
      this.playbackCurrentFrame += 1
    },

    async renderLoop(timestamp) {
      if (!usePlaybackDataStore().playbackInitialized) {
        return
      }

      // only update every 0.25s
      // if (timestamp - this.lastUpdate < 250) {
      //   recordingData.playbackRenderId = window.requestAnimationFrame(this.renderLoop)
      //   return
      // }

      this.updateEntities()

      // calculate FPS
      this.calculateFPSNormal()

      // request next frame
      recordingData.playbackRenderId = window.requestAnimationFrame(this.renderLoop)
    },

    calculateFPSNormal() {
      var t = performance.now()
      var dt = t - this.fpsStartTime

      // if elapsed time is greater than 1s
      if (dt > 1000) {
        // calculate the frames drawn over the period of time
        this.fpsNormal = (this.fpsFrames * 1000) / dt
        // and restart the values
        this.fpsFrames = 0
        this.fpsStartTime = t
      }
      this.fpsFrames++
    },

    async playbackLoop() {
      // console.log('Playback loop')
      // check if playback is running
      if (!this.playbackRunning || this.playbackCurrentFrame >= this.activeRecordingData.endFrame) {
        this.stopPlayback()
        return
      }

      // if fps is too low, skip frames to catch up to accurate render time
      if (this.fpsNormal < this.fpsTarget) {
        // console.log('Skipping frames')
        this.playbackCurrentFrame += Math.floor(this.fpsTarget / this.fpsNormal)
      } else {
        this.playbackCurrentFrame += 1
      }
      if (this.playbackCurrentFrame % 5 == 0) {
        this.$router.replace({
          query: { ...this.$route.query, frame: this.playbackCurrentFrame }
        })
        // console.log('updated hash')
      }

      // wait for next frame
      setTimeout(() => {
        this.playbackLoop()
      }, 1000 / this.fpsTarget)
      return
    },

    async updateEntities() {
      // iterate through playbackUnits and update
      for (var unitId in Object.keys(this.playbackEntities)) {
        var unit = this.playbackEntities[unitId]
        unit.updateAtFrame(this.playbackCurrentFrame)
      }
    }
  }
}
</script>


<style>
.entity-popup .maplibregl-popup-content {
  background: none;
  background-color: transparent;
  font-family: 'Pixelated MS Sans Serif', Arial;
  line-height: 1;
  /* outline */
  color: black;
  /* -webkit-text-stroke: 0.2px white; */
  /* -webkit-text-fill-color: black; */
  /* text-shadow: -1px 1px 0 #000; */
  /* 1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000; */

  box-shadow: none;
  border: none;
  padding: none;
  margin: none;
}

.maplibregl-popup-tip {
  display: none;
}

/* allow scroll through popups */
.maplibregl-popup,
.maplibregl-popup-content,
.entity-popup {
  pointer-events: none;
  user-select: none;
}
</style>

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