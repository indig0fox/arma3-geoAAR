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

<style scoped>
li.selected {
  background-color: #000784;
  color: white;
  padding: 2px;
  border: 1px dotted;
}
</style>
