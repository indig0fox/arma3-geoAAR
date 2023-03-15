<script setup>
import { RouterView } from 'vue-router'

// pinia
import { useRecordingDataStore } from '@/stores/recordings.js'
import { mapState, mapWritableState } from 'pinia'

import LocaleChanger from '@/components/LocaleChanger.vue'
import { ScaleLoader } from 'vue3-spinner'
</script>

<template>
  <div class="window" id="interface">
    <div id="top-navbar" class="title-bar" style="max-height: 16px">
      <div id="top-navbar-left">
        <router-link to="/">
          <img src="@/assets/img/a3white.png" />
        </router-link>
        <div class="title-bar-text" style="margin-right: 0px">
          {{ $t('app.windowTitle') }}
        </div>
        <div class="title-bar-text" style="margin-right: 0px">
          {{ $t('app.version') }}{{ $t('app.versionNumber') }}
        </div>

        <LocaleChanger />

        <div class="title-bar-text">
          <span>{{ $t('app.world') }}:&nbsp;</span>
          <span v-if="activeWorld" style="color: yellow; font-family: monospace">
            {{ activeWorld.displayName }} &lt;{{ activeWorld.worldName }}&gt;
          </span>
          <span v-show="!activeWorld" style="color: yellow; font-family: monospace">
            {{ $t('app.noWorldLoaded') }}
          </span>
        </div>
        <div class="title-bar-text">
          <span>{{ $t('app.recording') }}:&nbsp;</span>
          <!-- add mission name, and add author but truncate if too long -->
          <span v-if="activeRecordingData" style="color: yellow; font-family: monospace">
            {{ activeRecordingData.missionName }} &lt;{{
              activeRecordingData.missionAuthor?.length > 30
                ? activeRecordingData.missionAuthor.substring(0, 30) + '...'
                : activeRecordingData.missionAuthor
            }}&gt;
          </span>
          <span v-show="!activeRecordingData" style="color: yellow; font-family: monospace">
            {{ $t('app.noRecordingLoaded') }}
          </span>
        </div>
      </div>
      <div id="top-navbar-center" style="display: flex; flex-direction: row; height: 80%"></div>
      <!-- <div id="top-navbar-right" style="display: flex; flex-direction: row; height: 80%"> -->

      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
      <!-- </div> -->
    </div>
    <div id="window-body" class="window-body">
      <menu role="tablist" aria-label="Component Tabs">
        <router-link
          :to="{
            name: 'worlds',
            query: { id: activeRecording?.id, world: activeWorld?.worldName }
          }"
        >
          <button role="tab" aria-controls="tab-A" :aria-selected="$route.name == 'worlds'">
            {{ $t('app.tabs.worldsList') }}
          </button>
        </router-link>
        <router-link
          :to="{
            name: 'worldViewer',
            query: { id: activeRecording?.id, world: activeWorld?.worldName }
          }"
        >
          <button role="tab" aria-controls="tab-B" :aria-selected="$route.name == 'worldViewer'">
            {{ $t('app.tabs.worldViewer') }}
          </button>
        </router-link>
        <button role="tab" aria-controls="tab-C">Planner</button>
        <router-link
          :to="{
            name: 'recordings',
            query: { id: activeRecording?.id, world: activeWorld?.worldName }
          }"
        >
          <button role="tab" aria-controls="tab-D" :aria-selected="$route.name == 'recordings'">
            {{ $t('app.tabs.recordingsList') }}
          </button>
        </router-link>
        <router-link
          :to="{
            name: 'recordingViewer',
            query: { id: activeRecording?.id, world: activeWorld?.worldName }
          }"
        >
          <button
            role="tab"
            aria-controls="tab-E"
            :aria-selected="$route.name == 'recordingViewer'"
          >
            {{ $t('app.tabs.recordingViewer') }}
          </button>
        </router-link>
        <router-link to="/about">
          <button role="tab" aria-controls="tab-F" :aria-selected="$route.name == 'about'">
            {{ $t('app.tabs.about') }}
          </button>
        </router-link>
      </menu>

      <article role="tabpanel" id="main">
        <ScaleLoader v-if="(!worldsLoaded || !recordingsLoaded) && !error" :color="'#02108a'" />
        <RouterView />
      </article>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {},
  // beforeRouteEnter: function (to, from, next) {

  // },
  data() {
    return {}
  },
  components: {
    ScaleLoader
  },
  computed: {
    ...mapWritableState(useRecordingDataStore, [
      'availableWorlds',
      'availableRecordings',
      'activeWorld',
      'activeRecording',
      'activeRecordingData'
    ]),
    ...mapState(useRecordingDataStore, ['worldsLoaded', 'recordingsLoaded', 'error'])
  },
  mounted() {},
  methods: {}
}
</script>

<style>
.title-bar-text {
  pointer-events: none;
  user-select: none;
  display: flex;
  align-items: center;
}
.title-bar-icon {
  height: 15px;
}

body {
  user-select: none;
}
</style>

<style scoped>
#top-navbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
#top-navbar-left img {
  height: 15px;
}

#interface {
  /* position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh; */
  height: 100%;
  width: auto;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  align-content: stretch;

  overflow: auto;
  /* overflow: hidden; */
  overflow-x: hidden;
}

#window-body {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  /* justify-content: stretch;
  align-items: stretch;
  align-content: stretch; */
  flex: 1 auto;
  /* height: 100%; */
}

#main {
  display: block;
  flex: 1 auto;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  align-content: stretch;
  height: 100%;
}

menu[role='tablist'] button[aria-selected='true']:first-of-type {
  left: 0;
}
menu[role='tablist'] button:first-of-type:before {
  content: '';
  display: block;
  position: absolute;
  z-index: -1;
  top: 100%;
  left: 0;
  height: 2px;
  width: 0;
  border-left: 1px solid #fff;
  border-right: 1px solid #dfdfdf;
}
menu[role='tablist'] button[aria-selected='true'] {
  top: 2px;
  margin-right: -1px;
  margin-top: -4px;
  padding-bottom: 2px;
  margin-top: -2px;
  background-color: silver;
  position: relative;
  z-index: 8;
  margin-left: -3px;
  margin-bottom: 1px;
}
menu[role='tablist'] button:focus {
  outline: 1px dotted #222;
  outline-offset: -4px;
}

menu[role='tablist'] button {
  padding: 3px 12px;
  top: 3px;
  background: silver;
  box-shadow: inset 1px 1px #fff, inset 2px 2px #dfdfdf, inset -1px 0 #000, inset -2px 0 #7f7f7f;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
  border-bottom: 2px solid transparent;
  z-index: 1;
  display: block;
  color: #222;
  text-decoration: none;
  min-width: unset;
}
menu[role='tablist'] {
  position: relative;
  margin: 0 0 -2px;
  text-indent: 0;
  list-style-type: none;
  display: flex;
  padding-left: 3px;
}

[role='tabpanel'] {
  box-shadow: inset 1px 1px #fff, inset 2px 2px #dfdfdf, inset -1px -1px #0a0a0a,
    inset -2px -2px grey;
}

[role='tabpanel'] {
  padding: 7px;
  clear: both;
  background: silver;
  border: none;
  /* position: relative; */
  z-index: 2;
  margin-bottom: 9px;
}
</style>
