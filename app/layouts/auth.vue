<template>
  <div class="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-4 py-8">
    <!-- Logo / Brand -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-brand-primary tracking-tight">Tuki</h1>
      <p class="text-sm text-text-muted mt-1">Festival Food & Drinks</p>
    </div>

    <!-- Page content (login/register forms) -->
    <div class="w-full max-w-sm">
      <slot />
    </div>
  </div>
</template>
