<script setup>
import { ref } from 'vue'
import RecordingsModal from '../components/RecordingsModal.vue'
import { useRecordingDataStore } from '../stores/recordings.js'

const recordingData = useRecordingDataStore()

const showRecordingModal = ref(false)
</script>

<template>
  <main>
    <button @click="showRecordingModal = true">Show Recordings</button>
    <RecordingsModal
      key="{{ recordings }}"
      :recordings="recordingData.availableRecordings"
      v-show="showRecordingModal"
      @close="showRecordingModal = false"
    />
  </main>
</template>
