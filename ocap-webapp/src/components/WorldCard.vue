<template>
  <div class="world-item window">
    <div class="title-bar">
      <span class="title-bar-text">{{ world.meta.displayName }}</span>
    </div>
    <div class="world-info window-body">
      <div class="world-info-text">
        <table>
          <!-- author, size -->
          <tr>
            <td>{{ $t('worlds.worldCard.author') }}</td>
            <td>{{ world.meta.author }}</td>
          </tr>
          <tr>
            <td>{{ $t('worlds.worldCard.size') }}</td>
            <td
              v-html="
                $t('worlds.worldCard.sizeValue', {
                  size: (world.meta.worldSize / 1000).toFixed(1)
                })
              "
            ></td>
          </tr>
        </table>
        <router-link :to="{ name: 'worldViewer', query: { world: world.meta.worldName } }">
          <button class="btn btn-primary">View</button>
        </router-link>
      </div>
      <div>
        <img
          class="world-preview"
          :src="world.preview"
          :alt="world.meta.displayName"
          v-if="world.preview"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorldCard',
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

.world-info-text {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: stretch;
  align-items: stretch;

  text-align: left;
  width: 100%;
  height: 100%;
  font-weight: bold;
}

.world-preview {
  width: 100%;
  height: auto;
}
</style>
