<template>
  <div id="recordings-modal">
    <div id="title-bar">
      <div id="title-bar-text">
        <h1>Recordings</h1>
      </div>
      <div id="title-bar-controls">
        <button id="close-button" @click="closeModal">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
    <div id="modal-body">
      <div id="modal-body-content">
        <div id="modal-body-content-header">
          <div id="modal-body-content-header-controls">
            <!-- searchFilterOldest date input -->
            <input type="date" />
            <!-- searchFilterNewest date input -->
            <input type="date" />
            <!-- searchFilterMissionName input -->
            <input type="text" placeholder="Mission Name" />
            <!-- searchFilterWorldName input -->
            <input type="text" placeholder="World Name" />
            <!-- searchFilterTag input -->
            <input type="text" placeholder="Tag" />
            <!-- allow file upload -->
            <button>
              <input
                type="file"
                id="file"
                ref="file"
                @change="recordingFile = $event.target.files[0]"
                style="display: none"
              />
              <label for="file" class="material-icons">Upload a file</label>
            </button>
            <button class="material-icons">delete</button>
          </div>
        </div>
        <div id="recordings-list">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Mission Name</th>
                <th>Mission Duration</th>
                <th>World Name</th>
                <th>Tag</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recording in recordings" :key="recording.id">
                <td>{{ recording.date }}</td>
                <td>{{ recording.mission_name }}</td>
                <!-- show duration (s) in xxm xxs format -->
                <td>{{ getDuration(recording.mission_duration) }}</td>
                <td>{{ recording.world_name }}</td>
                <td>{{ recording.tag }}</td>
                <td>
                  <button
                    class="material-icons"
                    @click="recordingData.getRecordingData(recording.filename)"
                  >
                    play_arrow
                  </button>
                  <button class="material-icons">delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRecordingDataStore } from '../stores/recordings.js'
const recordingData = useRecordingDataStore()
</script>

<script>
export default {
  name: 'RecordingsModal',
  components: {},
  props: {
    recordings: {
      type: Array,
      required: true
    }
  },
  methods: {
    getDuration(duration) {
      const minutes = Math.floor(duration / 60)
      const seconds = Math.floor(duration % 60)
      return `${minutes}m ${seconds}s`
    },
    closeModal() {
      this.$emit('close')
    }
  },
  mounted() {},
  data() {
    return {
      recordingFile: null,
      selectedRecording: null
    }
  },
  computed: {
    recordingName() {
      return this.recordingFile ? this.recordingFile.name : 'No file selected'
    }
  }
}
</script>

<style scoped>
#recordings-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
}

#title-bar {
  display: flex;
  flex-direction: row;
  height: 50px;
  width: 100%;
  background-color: #fff;
  color: #000;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
}

#title-bar-text {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  width: 100%;
  padding-left: 10px;
}

#title-bar-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  width: 100%;
  padding-right: 10px;
}

#close-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 50px;
  background-color: transparent;
  border: none;
  outline: none;
  cursor: pointer;
}

#modal-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

#modal-body-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #fff;
}

#modal-body-content-header {
  display: flex;
  flex-direction: row;
  height: 50px;
  width: 100%;
  background-color: #fff;
  color: #000;
}

#modal-body-content-header-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  width: 100%;
  padding-left: 10px;
}

#recordings-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #fff;
  color: #000;
  overflow-y: auto;
}

#recordings-list table {
  width: 100%;
  padding: 10px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-collapse: collapse;
}

#recordings-list table thead {
  background-color: #f1f1f1;
}
</style>
