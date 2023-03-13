<script setup lang="ts" />

<template>
  <div>
    <div class="locale-changer">
      <select v-model="$i18n.locale">
        <option v-for="(lang, i) in langs" :key="`Lang${i}`" :value="lang.code">
          {{ lang.text }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'locale-changer',
  data() {
    return {
      langs: [
        { code: 'en', text: 'English' }
        // { code: 'fr', text: 'French' }
      ]
    }
  }
}
</script>
