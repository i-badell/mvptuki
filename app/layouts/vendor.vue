<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-op-bg flex flex-col">
    <!-- Vendor top nav -->
    <header class="sticky top-0 z-sticky bg-op-bg border-b border-op-border">
      <div class="max-w-2xl mx-auto px-5 h-[62px] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="font-display text-white text-3xl tracking-[3px] leading-none">TUKI</span>
          <span class="text-xs font-bold text-op-text-muted uppercase tracking-[1.5px]">Operador</span>
        </div>

        <nav class="flex items-center gap-1">
          <NuxtLink
            to="/dashboard"
            class="text-op-text-muted hover:text-white text-sm font-medium px-3 py-1 rounded-sm transition-colors"
            active-class="text-white bg-op-border"
          >
            Pedidos
          </NuxtLink>
          <NuxtLink
            to="/dashboard/scan"
            class="text-op-text-muted hover:text-white text-sm font-medium px-3 py-1 rounded-sm transition-colors"
            active-class="text-white bg-op-border"
          >
            Escanear QR
          </NuxtLink>
          <button
            class="text-op-text-muted hover:text-white text-sm px-3 py-1 rounded-sm transition-colors"
            @click="logout"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-2xl mx-auto w-full px-5 py-6">
      <slot />
    </main>
  </div>
</template>
