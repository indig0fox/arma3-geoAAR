<template>
  <div id="component-wrapper">
    <div id="recordings">
      <h4
        style="
          padding: 10px;
          color: white;
          text-shadow: 0 0 2px black, 0 0 2px black, 0 0 10px black, 0 0 10px black;
        "
      >
        Available Recordings
      </h4>
      <div id="app-window" class="window">
        <div class="title-bar">
          <span class="title-bar-text">Available recordings from {{ recordingsUrl }}</span>
        </div>
        <div id="filter-inputs">
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
            @change="processUploadedRecording"
            accept=".json"
            disabled
          />
        </div>
        <div id="recordings-list-container" class="window-body">
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
                  <router-link
                    :to="{
                      name: 'recordingViewer',
                      query: { id: recording.id, world: recording.world_name }
                    }"
                  >
                    <button class="btn btn-primary">View</button>
                  </router-link>
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
import { mapState, mapWritableState } from 'pinia'
import { useRecordingDataStore } from '@/stores/dataStore.js'
</script>

<script>
export default {
  name: 'RecordingsList',
  components: {},
  props: {},
  methods: {
    getDuration(duration) {
      const minutes = Math.floor(duration / 60)
      const seconds = Math.floor(duration % 60)
      return `${minutes}m ${seconds}s`
    },
    processUploadedRecording(e) {
      // * load local recording
      this.activeRecordingData = e.target.files[0]
      var filename = e.target.files[0].name
      var nowDate = new Date()
      var dateStr = nowDate.getFullYear() + '-' + (nowDate.getMonth() + 1) + '-' + nowDate.getDate()
      this.activeRecording = {
        id: 'local',
        mission_name: this.activeRecordingData.missionName,
        world_name: this.activeRecordingData.worldName,
        date: dateStr,
        mission_duration: this.activeRecordingData.endFrame,
        tag: 'local',
        filename: filename
      }

      // * save to local storage
      localStorage.setItem('localUpload_' + filename, JSON.stringify(this.activeRecordingData))

      this.$router.push({
        name: 'recordingViewer',
        query: { world: this.activeRecordingData.worldName }
      })
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
    ...mapWritableState(useRecordingDataStore, ['activeRecordingData']),
    ...mapState(useRecordingDataStore, ['availableRecordings']),
    ...mapWritableState(useRecordingDataStore, ['activeRecording', 'activeRecordingData']),
    recordingsUrl() {
      // get current web path
      return window.location.origin
    },
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

      // filter by map values
      const filteredRecordings = []

      for (const recording of this.availableRecordings.values()) {
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

        if (dateFilter && missionNameFilter && worldNameFilter && tagFilter) {
          filteredRecordings.push(recording)
        }
      }

      return filteredRecordings
    }
  }
}
</script>

<style>
#component-wrapper {
  height: 100%;
  width: auto;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}
#app-window {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  height: auto;
  width: 80%;
}

#recordings {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: auto;
  height: 100%;

  background: url('@/assets/img/arma3_screenshot_20.jpg');
  border: 5px solid #000000;
}

#filter-inputs {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
  align-content: center;
  margin: 8px;
  gap: 8px;
}

#filter-inputs > button {
  height: inherit;
  width: 20%;
  /* border-radius: 50%; */
  background-color: rgb(179 196 255);
  border: none;
  outline: none;
  cursor: pointer;
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

#recordings-list-container {
  overflow-y: scroll;
  height: auto;
  max-height: 60vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

#recordings-list {
  border-collapse: collapse;
  margin: 8px;
  width: 100%;
  height: 100%;
}
#recordings-list > thead {
  /* width: 100%; */
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

#recordings-list td {
  /* table body */
  border: 1px solid #000000;
  padding: 0 5px;
  text-align: left;
  background: #555;
  color: #fff;
}
</style>
