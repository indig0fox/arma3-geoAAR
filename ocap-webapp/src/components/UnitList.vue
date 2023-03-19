<template>
  <div id="unit-list">
    <ul class="tree-view">
      <li>
        {{ $t("playerList.blufor") }}
        <ul>
          <UnitListItem
            v-for="unit in bluforUnits"
            :key="unit.id"
            :unit="unit"
            :selected="unit.id === selectedUnitId"
            @click="selectUnit(unit)"
          />
        </ul>
      </li>
      <li>
        {{ $t("playerList.opfor") }}
        <ul>
          <UnitListItem
            v-for="unit in opforUnits"
            :key="unit.id"
            :unit="unit"
            :selected="unit.id === selectedUnitId"
            @click="selectUnit(unit)"
          />
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
import { useRecordingDataStore } from "@/stores/dataStore.js";
import { usePlaybackDataStore } from "@/stores/playbackStore.js";
import { mapState, mapWritableState } from "pinia";
import UnitListItem from "@/components/UnitListItem.vue";

import { Unit, Vehicle } from "@/playbackNew/entities.js";
export default {
  name: "UnitList",
  components: {
    UnitListItem,
  },
  mounted() {
    this.updateUnitLists();
  },
  data() {
    return {
      bluforUnits: [],
      opforUnits: [],
    };
  },
  computed: {
    ...mapState(useRecordingDataStore, ["mainMap"]),
    ...mapState(usePlaybackDataStore, ["playbackEntities", "playbackCurrentFrame"]),
    ...mapWritableState(usePlaybackDataStore, ["selectedUnitId"]),
  },
  methods: {
    selectUnit(unit) {
      this.selectedUnitId = unit.id;
      this.mainMap.panTo(unit.position);
    },
    updateUnitLists() {
      this.bluforUnits = [];
      this.opforUnits = [];
      for (const entityId in this.playbackEntities) {
        const entity = this.playbackEntities[entityId];

        if (entity instanceof Unit) {
          if (entity.side === "WEST") {
            this.bluforUnits.push(entity);
          } else if (entity.side === "EAST") {
            this.opforUnits.push(entity);
          }
        }
      }

      this.bluforUnits.sort((a, b) => {
        return a.id - b.id;
      });
      this.opforUnits.sort((a, b) => {
        return a.id - b.id;
      });
    },
  },
  watch: {
    playbackCurrentFrame: function (newFrame, oldFrame) {
      this.updateUnitLists();
    },
  },
};
</script>

<style scoped>
#unit-list {
  display: flex;
  flex-direction: column;
  height: 300px;
  width: auto;
  overflow-y: auto;
}
li.selected {
  background-color: #000784;
  color: white;
  padding: 2px;
  border: 1px dotted;
}
</style>
