<template>
  <li :class="{ selected: selected }">{{ unit.name }} - {{ unit.role }}</li>
</template>

<script>
export default {
  props: {
    unit: {
      type: Object,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style scoped></style>
