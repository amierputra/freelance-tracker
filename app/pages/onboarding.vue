<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
</script>

<template>
  <div class="max-w-2xl">
    <PageHeader
      title="Getting started"
      description="Each step builds on the one before: a project needs a client, payments need a project, and invoices need a payment."
    />
    <OnboardingChecklist show-dismissed />
  </div>
</template>
