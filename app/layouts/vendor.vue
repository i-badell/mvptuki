<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-surface-muted flex flex-col">
    <!-- Vendor top nav -->
    <header class="sticky top-0 z-40 bg-brand-primary shadow-md">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-white font-bold text-lg">Tuki</span>
          <span class="text-white/60 text-sm">Vendor</span>
        </div>

        <nav class="flex items-center gap-2">
          <NuxtLink
            to="/dashboard"
            class="text-white/80 hover:text-white text-sm font-medium px-3 py-1 rounded transition-colors"
            active-class="text-white bg-white/20"
          >
            Orders
          </NuxtLink>
          <NuxtLink
            to="/dashboard/scan"
            class="text-white/80 hover:text-white text-sm font-medium px-3 py-1 rounded transition-colors"
            active-class="text-white bg-white/20"
          >
            Scan QR
          </NuxtLink>
          <button
            class="text-white/60 hover:text-white text-sm px-3 py-1 rounded transition-colors"
            @click="logout"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
      <slot />
    </main>
  </div>
</template>
