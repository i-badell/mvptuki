<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const { festival, vendors, pending, error, refresh } = useFestival()
const { fetchOrders } = useOrder()

const isSingleVendor = computed(() => vendors.value.length === 1)

// ── Category filter ───────────────────────────────────────────────────────────
const CATEGORIES = ['Todos', '🍔 Burgers', '🌮 Tacos', '🍕 Pizza', '🍜 Ramen', '🍺 Drinks']
const KEYWORDS: Record<string, string[]> = {
  '🍔 Burgers': ['burger', 'hamburgue', 'smash'],
  '🌮 Tacos': ['taco', 'mexic', 'burrито'],
  '🍕 Pizza': ['pizza', 'fornac', 'napol'],
  '🍜 Ramen': ['ramen', 'noodle', 'asian', 'asiat'],
  '🍺 Drinks': ['drink', 'bebid', 'bar', 'cerveza'],
}
const selectedCategory = ref('Todos')

const filteredVendors = computed(() => {
  if (selectedCategory.value === 'Todos') return vendors.value
  const kws = KEYWORDS[selectedCategory.value] ?? []
  return vendors.value.filter((v) => {
    const haystack = `${v.name} ${v.description ?? ''}`.toLowerCase()
    return kws.some((kw) => haystack.includes(kw))
  })
})

// ── Active orders strip ───────────────────────────────────────────────────────
const activeOrderCount = ref(0)

onMounted(async () => {
  const orders = await fetchOrders()
  activeOrderCount.value = orders.filter(
    (o) => o.status === 'confirmed' || o.status === 'preparing',
  ).length
})
</script>

<template>
  <div class="flex flex-col">
    <!-- ── Loading skeleton ────────────────────────────────────────────────── -->
    <template v-if="pending">
      <div class="-mx-4 -mt-4 h-[210px] bg-gray-200 animate-pulse" />
      <div class="mt-4 h-14 rounded-md bg-gray-100 animate-pulse" />
      <div class="mt-5 h-8 rounded-md bg-gray-100 animate-pulse" />
      <div class="mt-4 h-[320px] rounded-lg bg-gray-100 animate-pulse" />
    </template>

    <!-- ── Error state ─────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-gray-500 text-sm">{{ error }}</p>
      <button
        class="mt-4 px-5 py-2 rounded-md bg-black text-white text-sm font-bold"
        @click="refresh"
      >
        Reintentar
      </button>
    </div>

    <!-- ── Festival content ────────────────────────────────────────────────── -->
    <template v-else-if="festival">

      <!-- Hero banner -->
      <FestivalBanner :festival="festival" />

      <!-- ── Orders quick-access strip ──────────────────────────────────── -->
      <NuxtLink
        v-if="activeOrderCount > 0"
        to="/orders"
        class="flex items-center justify-between mt-4 px-4 py-3 rounded-md cursor-pointer transition-colors active:bg-red-50"
        style="background: #fff8f8; border: 1.5px solid var(--color-red);"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="flex items-center justify-center flex-shrink-0 bg-red rounded-lg"
            style="width: 34px; height: 34px;"
          >
            <svg style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 12h6M9 16h4" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-black" style="font-size: 12px; line-height: 1.2;">Tus pedidos</p>
            <p class="text-red font-medium" style="font-size: 11px;">
              ● {{ activeOrderCount }} en preparación
            </p>
          </div>
        </div>
        <span class="text-red font-bold text-lg">→</span>
      </NuxtLink>

      <!-- ── Single vendor — condensed inline menu ──────────────────────── -->
      <template v-if="isSingleVendor">
        <h2 class="font-display tracking-[2px] text-black mt-5" style="font-size: 24px;">Menú</h2>
        <SingleVendorMenu :vendor="vendors[0]" />
      </template>

      <!-- ── Multi-vendor — horizontal carousel ────────────────────────── -->
      <template v-else>

        <!-- Section header -->
        <div class="flex items-center justify-between mt-5 mb-3.5">
          <h2 class="font-display tracking-[2.5px] text-black" style="font-size: 24px;">
            Food Trucks
          </h2>
          <NuxtLink
            to="/trucks"
            class="text-red font-bold rounded-[5px] transition-colors active:bg-red active:text-white"
            style="font-size: 12px; border: 1.5px solid var(--color-red); padding: 4px 11px;"
          >
            Ver todos →
          </NuxtLink>
        </div>

        <!-- Category pills -->
        <div class="-mx-4 flex gap-2 overflow-x-auto scrollbar-none px-4 mb-5">
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            class="flex-shrink-0 py-2 px-[18px] rounded-[6px] font-semibold transition-all whitespace-nowrap"
            :class="
              selectedCategory === cat
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200'
            "
            style="font-size: 12px; border-width: 1.5px; border-style: solid; letter-spacing: 0.3px;"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Trucks horizontal carousel -->
        <div class="-mx-4 flex gap-3.5 overflow-x-auto scrollbar-none px-4 pb-1.5">
          <VendorCard
            v-for="vendor in filteredVendors"
            :key="vendor.id"
            :vendor="vendor"
          />
          <div v-if="filteredVendors.length === 0" class="text-gray-400 text-sm py-4">
            Sin resultados para esta categoría.
          </div>
        </div>

        <!-- See-all banner -->
        <NuxtLink
          to="/trucks"
          class="flex items-center justify-between mt-4 px-5 py-4 rounded-lg transition-all active:translate-x-[3px] active:translate-y-[3px]"
          style="border: 1.5px solid #111111; box-shadow: var(--shadow-md); background: var(--color-gray-50);"
        >
          <div class="flex items-center gap-3">
            <span class="text-[22px]" style="letter-spacing: -4px;">🍔🌮🍕</span>
            <div>
              <p class="font-display tracking-[2px] text-black" style="font-size: 17px;">
                Ver catálogo completo
              </p>
              <p class="text-gray-500 mt-px" style="font-size: 11px;">
                {{ vendors.length }} food trucks disponibles hoy
              </p>
            </div>
          </div>
          <div
            class="flex items-center justify-center rounded-full bg-black flex-shrink-0"
            style="width: 36px; height: 36px;"
          >
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </NuxtLink>

      </template>

      <!-- ── Venue map ──────────────────────────────────────────────────── -->
      <div class="mt-5">
        <div class="flex items-center justify-between mb-3.5">
          <h2 class="font-display tracking-[2.5px] text-black" style="font-size: 24px;">
            Mapa del evento
          </h2>
        </div>
        <VenueMap :map-url="festival.map_url" />
      </div>

      <!-- Bottom padding for nav clearance -->
      <div class="h-6" />
    </template>

    <!-- ── No active festival ──────────────────────────────────────────────── -->
    <div v-else class="text-center py-16">
      <p class="text-4xl mb-4">🎪</p>
      <p class="text-gray-500">No hay ningún festival activo por ahora. ¡Volvé pronto!</p>
    </div>
  </div>
</template>
