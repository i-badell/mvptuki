<script setup lang="ts">
const { signOut } = useSupabaseClient().auth;
const { itemCount } = useCart();
const route = useRoute();

async function logout() {
  await signOut();
  navigateTo("/login");
}

// Derive active tab from current route
const activeTab = computed(() => {
  const p = route.path;
  if (p.startsWith("/orders")) return "orders";
  if (p.startsWith("/vendors")) return "vendors";
  if (p.startsWith("/profile")) return "profile";
  if (p.startsWith("/festival")) return "home";
  return "home";
});
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header
      class="sticky top-0 z-sticky bg-white flex items-center justify-between px-5 py-4 border-b-2 border-black"
    >
      <!-- Logo -->
      <NuxtLink
        to="/festival"
        class="font-display text-black leading-none text-4xl tracking-[4px]"
      >
        TU<span class="text-red">KI</span>
      </NuxtLink>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Profile button -->
        <NuxtLink
          class="flex items-center justify-center rounded-full bg-gray-50 border-[1.5px] border-black w-[38px] h-[38px] text-base transition-transform active:scale-[0.91]"
          aria-label="Mi perfil"
          to="/profile"
        >
          👤
        </NuxtLink>

        <!-- Cart button -->
        <button
          class="relative flex items-center justify-center rounded-full bg-red w-[40px] h-[40px] border-0 transition-transform active:scale-[0.91]"
          aria-label="Carrito"
          @click="navigateTo('/checkout')"
        >
          <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
            />
          </svg>
          <span
            v-if="itemCount > 0"
            class="absolute flex items-center justify-center bg-black text-white font-bold rounded-full -top-1 -right-1 w-4 h-4 text-xs"
          >
            {{ itemCount }}
          </span>
        </button>
      </div>
    </header>

    <!-- ── Main content ────────────────────────────────────────────────── -->
    <main class="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-[88px]">
      <slot />
    </main>

    <!-- ── Bottom navigation ───────────────────────────────────────────── -->
    <nav
      class="fixed bottom-0 left-1/2 -translate-x-1/2 border-t-2 border-black h-[68px] w-full max-w-lg bg-white flex items-stretch z-overlay"
    >
      <!-- Inicio -->
      <NuxtLink
        to="/festival"
        class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors pt-[10px] px-1 pb-[14px] border-r-[1.5px] border-r-gray-200"
        :class="activeTab === 'home' ? 'bg-gray-50' : ''"
        aria-label="Inicio"
      >
        <span class="flex items-center justify-center w-[22px] h-[22px]">
          <svg
            class="w-5 h-5 fill-none"
            :class="activeTab === 'home' ? 'stroke-red' : 'stroke-gray-500'"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </span>
        <span
          class="font-semibold text-xs"
          :class="activeTab === 'home' ? 'text-red' : 'text-gray-500'"
        >
          Inicio
        </span>
      </NuxtLink>

      <!-- Pedidos -->
      <NuxtLink
        to="/orders"
        class="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors pt-[10px] px-1 pb-[14px] border-r-[1.5px] border-r-gray-200"
        :class="activeTab === 'orders' ? 'bg-gray-50' : ''"
        aria-label="Pedidos"
      >
        <span class="flex items-center justify-center w-[22px] h-[22px]">
          <svg
            class="w-5 h-5 fill-none"
            :class="activeTab === 'orders' ? 'stroke-red' : 'stroke-gray-500'"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
            />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
        </span>
        <span
          class="font-semibold text-xs"
          :class="activeTab === 'orders' ? 'text-red' : 'text-gray-500'"
        >
          Pedidos
        </span>
      </NuxtLink>

      <!-- Carrito (elevated center) -->
      <button
        class="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors pt-[10px] px-1 pb-[14px] border-r-[1.5px] border-r-gray-200"
        aria-label="Carrito"
        @click="navigateTo('/checkout')"
      >
        <!-- Badge -->
        <span
          v-if="itemCount > 0"
          class="absolute z-10 flex items-center justify-center bg-black text-white font-bold rounded-full top-1 right-[calc(50%-26px)] w-4 h-4 text-[9px]"
        >
          {{ itemCount }}
        </span>
        <!-- Elevated red circle -->
        <span
          class="flex items-center justify-center rounded-full bg-red w-11 h-11 border-2 border-black shadow-[2px_2px_0_#111111] -mb-1 -mt-4"
        >
          <svg
            class="w-5 h-5 fill-none stroke-white"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="9" cy="21" r="1" fill="white" stroke="none" />
            <circle cx="20" cy="21" r="1" fill="white" stroke="none" />
            <path
              d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.61L23 6H6"
            />
          </svg>
        </span>
        <span class="font-bold text-gray-700 text-xs">Carrito</span>
      </button>

      <!-- Trucks -->
      <NuxtLink
        to="/vendors"
        class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors pt-[10px] px-1 pb-[14px] border-r-[1.5px] border-r-gray-200"
        :class="activeTab === 'vendors' ? 'bg-gray-50' : ''"
        aria-label="Puestos"
      >
        <span class="flex items-center justify-center w-[22px] h-[22px]">
          <svg
            class="w-5 h-5 fill-none"
            :class="activeTab === 'vendors' ? 'stroke-red' : 'stroke-gray-500'"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </span>
        <span
          class="font-semibold text-xs"
          :class="activeTab === 'vendors' ? 'text-red' : 'text-gray-500'"
        >
          Puestos
        </span>
      </NuxtLink>

      <!-- Perfil -->
      <NuxtLink
        to="/profile"
        class="flex-1 flex flex-col items-center justify-center gap-1 transition-colors pt-[10px] px-1 pb-[14px]"
        :class="activeTab === 'profile' ? 'bg-gray-50' : ''"
        aria-label="Perfil"
      >
        <span class="flex items-center justify-center w-[22px] h-[22px]">
          <svg
            class="w-5 h-5 fill-none"
            :class="activeTab === 'profile' ? 'stroke-red' : 'stroke-gray-500'"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span
          class="font-semibold text-xs"
          :class="activeTab === 'profile' ? 'text-red' : 'text-gray-500'"
          >Perfil</span
        >
      </NuxtLink>
    </nav>

    <!-- Global toasts -->
    <AppToast />
  </div>
</template>
