<template>
  <div class="world-item window">
    <div class="title-bar">
      <span class="title-bar-text">{{ world.displayName }}</span>
    </div>
    <div class="world-info window-body">
      <div class="world-info-left">
        <div class="world-info-text">
          <table>
            <!-- author, size -->
            <tr>
              <td>{{ $t('worlds.worldCard.author') }}:</td>
              <td>{{ world.author }}</td>
            </tr>
            <tr>
              <td>{{ $t('worlds.worldCard.size') }}:</td>
              <td
                v-html="
                  $t('worlds.worldCard.sizeValue', {
                    size: (world.worldSize / 1000).toFixed(1)
                  })
                "
              ></td>
            </tr>
          </table>
        </div>
        <div class="world-info-actions">
          <PreviewMap :world="world" />
          <router-link :to="{ name: 'worldViewer', query: { world: world.worldName } }">
            <button class="btn btn-primary">
              {{ $t('worlds.worldCard.selectWorld') }}
            </button>
          </router-link>
        </div>
      </div>
      <div style="display: flex; justify-content: center; align-items: center">
        <img
          class="world-preview"
          :src="world.preview"
          :alt="world.displayName"
          v-show="world.preview"
        />
        <div>
          <!-- show blank 256px div if no preview -->
          <ScaleLoader class="world-preview" v-if="!world.preview" :color="'#02108a'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ScaleLoader } from 'vue3-spinner'
import PreviewMap from '@/components/PreviewMap.vue'
</script>

<script>
export default {
  name: 'WorldCard',
  components: {
    ScaleLoader,
    PreviewMap
  },
  data() {
    return {}
  },
  props: {
    world: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.world-item {
  width: 40%;
  height: auto;
  max-width: 325px;

  /* background: #000000; */

  /* border-radius: 4px; */
  /* box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05); */
  /* padding: 10px; */
  /* background-position: center center; */
}
.world-info {
  z-index: 1;
  /* position: relative; */

  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
}

.world-info-left {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;
  flex: 1 auto;
}

.world-info-text {
  /* display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch; */

  text-align: left;
  width: 100%;
  height: 100%;
  font-weight: bold;
}

.world-info-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: center;
  gap: 5px;
}

.world-preview {
  /* width: 100%; */
  max-width: 128px;
  margin: 5px;
  border: 1px solid #000;
  border-radius: 4px;
}
</style>
