<script setup lang="ts">
// Server-side redirect based on auth state
const user = useSupabaseUser()
navigateTo(user.value ? '/festival' : '/login', { redirectCode: 301 })
</script>

<template>
  <!-- Redirect page — no visible content -->
  <div />
</template>
