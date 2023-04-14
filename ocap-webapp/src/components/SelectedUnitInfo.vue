<template>
  <div id="selected-unit-info-content">
    <h5>{{ $t("playback.selectedUnit.unitName") }}: {{ unit.name }}</h5>
    <table>
      <tr>
        <td>{{ $t("playback.selectedUnit.unitId") }}:</td>
        <td>{{ unitId }}</td>
      </tr>
      <tr>
        <td>{{ $t("playback.selectedUnit.unitRole") }}:</td>
        <td>{{ unit.role }}</td>
      </tr>
      <tr>
        <td>{{ $t("playback.selectedUnit.unitType") }}:</td>
        <td>{{ unit.type }}</td>
      </tr>
      <tr>
        <td>{{ $t("playback.selectedUnit.unitSide") }}:</td>
        <td>{{ unit.side }}</td>
      </tr>
      <tr>
        <!-- pos -->
        <td>{{ $t("playback.selectedUnit.unitPosition") }}:</td>
        <td style="font-family: monospace">
          {{ lonLatToGridXY(unit.position) }}
        </td>
      </tr>
    </table>

    <input type="checkbox" id="showUnitPath" v-model="showSelectedUnitPath" />
    <label for="showUnitPath">{{ $t("playback.selectedUnit.showPath") }}</label>
    <input type="checkbox" id="followUnit" v-model="followSelectedUnit" />
    <label for="followUnit">{{ $t("playback.selectedUnit.follow") }}</label>
  </div>
</template>

<script setup>
import { usePlaybackDataStore } from "@/stores/playbackStore.js";
import { lonLatToGridXY } from "@/playbackNew/utils.js";
</script>

<script>
import { mapState, mapWritableState } from "pinia";
import { usePlaybackDataStore } from "@/stores/playbackStore.js";

export default {
  name: "SelectedUnitInfo",
  props: {
    unitId: {
      type: Number,
      required: true,
    },
  },
  computed: {
    unit() {
      return usePlaybackDataStore().getUnitById(this.unitId);
    },
    ...mapWritableState(usePlaybackDataStore, [
      "showSelectedUnitPath",
      "followSelectedUnit",
    ]),
  },
};
</script>

<style scoped>
#selected-unit-info-content {
  display: flex;
  flex-direction: column;
}
</style>
