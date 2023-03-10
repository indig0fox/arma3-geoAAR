<script setup>
import { RouterView } from 'vue-router'

// pinia
import {useRecordingDataStore} from './stores/recordings.js'

// components
const recordingData = useRecordingDataStore()
recordingData.getRecordings()


</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
