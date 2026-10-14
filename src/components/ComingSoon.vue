<template>
  <div class="column items-center text-center text-grey-7 q-pa-xl">
    <q-icon :name="icon" size="64px" class="q-mb-md" />
    <div class="text-h6">{{ title }}</div>
    <div class="q-mt-sm">{{ description }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
}>();
</script>
