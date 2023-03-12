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
    <div id="modal-content">
      <div id="modal-body-header">
        <!-- searchFilterOldest date input -->
        <input type="date" class="filter-date" v-model="searchFilterOldest" />
        <!-- searchFilterNewest date input -->
        <input type="date" class="filter-date" v-model="searchFilterNewest" />
        <!-- searchFilterMissionName input -->
        <input
          type="text"
          class="filter-longtext"
          placeholder="Mission Name"
          v-model="searchFilterMissionName"
        />
        <!-- searchFilterWorldName input -->
        <input
          type="text"
          class="filter-shorttext"
          placeholder="World Name"
          v-model="searchFilterWorld"
        />
        <!-- searchFilterTag input -->
        <input type="text" class="filter-shorttext" placeholder="Tag" v-model="searchFilterTag" />
        <!-- allow file upload -->
        <input
          type="file"
          id="file"
          ref="file"
          @change="recordingFile = $event.target.files[0]"
          accept=".json.gz"
          disabled
        />
      </div>

      <table id="recordings-list">
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
          <tr v-for="recording in recordingsFiltered" :key="recording.id">
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
</template>

<script setup>
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '../stores/recordings.js'
const recordingData = useRecordingDataStore()
</script>

<script>
export default {
  name: 'RecordingsModal',
  components: {},
  props: {},
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
    ...mapWritableState(useRecordingDataStore, ['searchFilterMissionName']),
    ...mapWritableState(useRecordingDataStore, ['searchFilterWorld']),
    ...mapWritableState(useRecordingDataStore, ['searchFilterTag']),
    ...mapWritableState(useRecordingDataStore, ['searchFilterOldest']),
    ...mapWritableState(useRecordingDataStore, ['searchFilterNewest']),
    ...mapState(useRecordingDataStore, ['availableRecordings']),
    recordingsFiltered() {
      // filter recordings by store state
      // console.log(
      //   'Search params: ',
      //   this.searchFilterMissionName,
      //   this.searchFilterWorld,
      //   this.searchFilterTag,
      //   this.searchFilterOldest,
      //   this.searchFilterNewest
      // )

      return this.availableRecordings.filter((recording) => {
        const date = new Date(recording.date)
        const dateFilter =
          (this.searchFilterOldest === '' || date >= new Date(this.searchFilterOldest)) &&
          (this.searchFilterNewest === '' || date <= new Date(this.searchFilterNewest))
        const missionNameFilter =
          this.searchFilterMissionName === '' ||
          recording.mission_name.toLowerCase().includes(this.searchFilterMissionName.toLowerCase())
        const worldNameFilter =
          this.searchFilterWorld === '' ||
          recording.world_name.toLowerCase().includes(this.searchFilterWorld.toLowerCase())
        const tagFilter =
          this.searchFilterTag === '' ||
          recording.tag.toLowerCase().includes(this.searchFilterTag.toLowerCase())

        return dateFilter && missionNameFilter && worldNameFilter && tagFilter
      })
    }
  }
}
</script>

<style scoped>
#recordings-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 90%;
  width: 90%;
  background-color: rgb(61, 61, 61);
  border-radius: 10px;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
}

#title-bar {
  display: flex;
  flex-direction: row;
  height: 50px;
  width: 100%;
  background-color: rgb(179 196 255);
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

#modal-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  height: 100%;
  overflow-y: scroll;
  margin: 10px;
  row-gap: 10px;
}

#modal-body-header {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  align-content: center;
  margin: 8px;
  gap: 8px;
}

#modal-body-header > input {
  height: 1.5em;
}

.filter-date {
  height: inherit;
  width: 35%;
  text-align: center;
}

.filter-longtext {
  height: inherit;
  width: 75%;
}

.filter-shorttext {
  height: inherit;
  width: 40%;
}

#modal-body-header > button {
  height: inherit;
  width: 20%;
  /* border-radius: 50%; */
  background-color: rgb(179 196 255);
  border: none;
  outline: none;
  cursor: pointer;
}

#recordings-list {
  border-collapse: collapse;
  margin: 8px;
  width: 100%;
  position: absolute;
}
#recordings-list > thead {
  /* border: 1px solid #000; */
  background-color: black;
  color: white;
  /* add gradient */
  background-image: linear-gradient(to top, #000, #747474);
  /* round corners */
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border: 1px solid #000;
}
#recordings-list > thead > tr > th {
  text-align: left;
  padding: 5px;
}
#recordings-list > tbody {
  border: 1px solid #000;
}
#recordings-list > tbody > tr > td {
  padding: 5px;
  border-bottom: 0.5pt solid rgba(255, 255, 255, 0.5);
  color: white;
}
</style>
