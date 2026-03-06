<script setup lang="ts">
const { signOut } = useSupabaseClient().auth
const user = useSupabaseUser()

const cartOpen = ref(false)

async function logout() {
  await signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col">
    <!-- Top nav -->
    <header class="sticky top-0 z-40 bg-surface border-b border-gray-100 shadow-sm">
      <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <NuxtLink to="/festival" class="text-xl font-bold text-brand-primary">Tuki</NuxtLink>

        <div class="flex items-center gap-3">
          <!-- Cart icon — shown on customer pages -->
          <button
            class="relative p-2 rounded-full hover:bg-surface-muted transition-colors"
            aria-label="Open cart"
            @click="cartOpen = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13l-1-4h12"
              />
            </svg>
          </button>

          <!-- Order history link -->
          <NuxtLink
            to="/orders"
            class="p-2 rounded-full hover:bg-surface-muted transition-colors"
            aria-label="My orders"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-lg mx-auto w-full px-4 py-4">
      <slot />
    </main>

    <!-- Cart drawer (wired in Phase 4) -->
    <CartDrawer v-model:open="cartOpen" />
  </div>
</template>
