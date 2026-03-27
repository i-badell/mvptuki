<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth" });

const route = useRoute();
const vendorId = route.params.vendorId as string;

const { items, vendor, pending, error } = useMenu(vendorId);
const { cart, itemCount, cartTotal } = useCart();

const isOpen = computed(() => vendor.value?.status === "active");
</script>

<template>
  <div class="min-h-screen -mt-4 -mx-4 bg-white font-sans pb-[88px]">
    <!-- ── Loading skeleton ───────────────────────────────────────────────── -->
    <template v-if="pending">
      <div class="h-[220px] bg-gray-900 animate-pulse" />
      <div class="flex border-b border-gray-200">
        <div
          v-for="i in 4"
          :key="i"
          class="flex-1 py-4 px-3 flex flex-col items-center gap-1"
        >
          <div class="h-5 w-10 bg-gray-100 rounded animate-pulse" />
          <div class="h-3 w-8 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div class="px-5 py-4 space-y-3">
        <div
          v-for="i in 5"
          :key="i"
          class="h-16 bg-gray-100 rounded-lg animate-pulse"
        />
      </div>
    </template>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="text-center py-16 px-5">
      <p class="text-gray-400 text-sm mb-4">{{ error }}</p>
      <button class="text-red font-bold text-sm" @click="$router.back()">
        ← Volver
      </button>
    </div>

    <!-- ── Content ────────────────────────────────────────────────────────── -->
    <template v-else-if="vendor">
      <!-- ── HERO ────────────────────────────────────────────────────────── -->
      <div class="relative overflow-hidden bg-red px-5 py-5">
        <!-- Floating vendor logo/emoji -->
        <div class="relative z-10 flex items-end justify-between">
          <h1
            class="font-display text-white text-[42px] leading-[0.9] tracking-[1px]"
          >
            {{ vendor.name }}
          </h1>

          <!-- Logo or emoji -->
          <NuxtImg
            v-if="vendor.logo_url"
            :src="vendor.logo_url"
            :alt="vendor.name"
            class="w-20 h-20 rounded-xl object-cover opacity-85 flex-shrink-0 ml-4"
          />
          <span
            v-else
            class="text-[72px] leading-none opacity-85 flex-shrink-0 ml-4 animate-[float_3s_ease-in-out_infinite]"
          >
            🍽️
          </span>
        </div>
      </div>

      <!-- ── PAUSED BANNER ────────────────────────────────────────────────── -->
      <div
        v-if="!isOpen"
        class="mx-5 mt-4 rounded-md px-4 py-3 font-bold text-[13px] text-red bg-[#fff8f8] border-[1.5px] border-red"
      >
        ⚠️ Este food truck está cerrado y no acepta pedidos por ahora.
      </div>

      <!-- ── DESCRIPTION ──────────────────────────────────────────────────── -->
      <div v-if="vendor.description" class="px-5 py-4 border-b border-gray-200">
        <p class="text-gray-700 text-[13px] leading-[1.6]">
          {{ vendor.description }}
        </p>
      </div>

      <!-- ── MENU ─────────────────────────────────────────────────────────── -->
      <div class="px-5">
        <MenuItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :vendor-id="vendorId"
          :vendor-name="vendor.name"
        />
        <p v-if="!items.length" class="text-center text-gray-400 py-10 text-sm">
          Sin items disponibles
        </p>
      </div>
    </template>

    <!-- ── CART BAR (fixed bottom) ─────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="translate-y-full opacity-0"
      leave-active-class="transition-all duration-200"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="itemCount > 0"
        class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-overlay pt-3 px-5 pb-5"
      >
        <button
          class="w-full flex items-center justify-between px-[18px] py-[14px] rounded-lg bg-black border-[1.5px] border-black shadow-[0_8px_32px_rgba(0,0,0,0.28)] transition-transform active:scale-[0.98]"
          @click="navigateTo('/checkout')"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex items-center justify-center bg-red text-white font-bold rounded-full flex-shrink-0 w-[28px] h-[28px] text-[13px]"
            >
              {{ itemCount }}
            </span>
            <span class="font-display text-white text-lg tracking-[2px]"
              >Ver carrito</span
            >
          </div>
          <span class="font-display text-white text-xl tracking-[1px]"
            >${{ cartTotal.toFixed(0) }}</span
          >
        </button>
      </div>
    </Transition>

    <AppToast />
  </div>
</template>
