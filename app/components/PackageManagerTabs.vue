<script setup lang="ts">
const selectedPM = defineModel<PackageManagerId>({ required: true })
</script>

<template>
  <ClientOnly>
    <button
      v-for="pm in packageManagers"
      :key="pm.id"
      type="button"
      role="tab"
      :aria-selected="selectedPM === pm.id"
      class="px-2 py-1 font-mono text-xs rounded transition-colors duration-150 border border-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
      :class="
        selectedPM === pm.id
          ? 'bg-bg shadow text-fg border-border'
          : 'text-fg-subtle hover:text-fg border-transparent'
      "
      @click="selectedPM = pm.id"
    >
      {{ pm.label }}
    </button>
    <template #fallback>
      <span
        v-for="pm in packageManagers"
        :key="pm.id"
        class="px-2 py-1 font-mono text-xs rounded"
        :class="pm.id === 'npm' ? 'bg-bg-elevated text-fg' : 'text-fg-subtle'"
      >
        {{ pm.label }}
      </span>
    </template>
  </ClientOnly>
</template>
