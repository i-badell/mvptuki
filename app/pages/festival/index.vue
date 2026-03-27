<script setup lang="ts">
import AppButton from "~/components/ui/AppButton.vue";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const { festival, vendors, categories, pending, error, refresh } = useFestival();
const { fetchOrders } = useOrder();

const isSingleVendor = computed(() => vendors.value.length === 1);

// ── Category filter ───────────────────────────────────────────────────────────
const selectedCategory = ref("Todos");

const filteredVendors = computed(() => {
  if (selectedCategory.value === "Todos") return vendors.value;
  const cat = categories.value.find((c) => c.label === selectedCategory.value);
  const kws = cat?.keywords ?? [];
  return vendors.value.filter((v) =>
    kws.some((kw) => v.keywords.includes(kw)),
  );
});

// ── Active orders strip ───────────────────────────────────────────────────────
const activeOrderCount = ref(0);

onMounted(async () => {
  const orders = await fetchOrders();
  activeOrderCount.value = orders.filter(
    (o) => o.status === "confirmed" || o.status === "preparing",
  ).length;
});
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
        class="flex bg-red-light border-1 border-red items-center justify-between mt-4 px-4 py-3 rounded-md cursor-pointer transition-colors active:bg-red-50"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="flex items-center justify-center flex-shrink-0 bg-red rounded-lg"
            style="width: 34px; height: 34px"
          >
            <svg
              style="width: 18px; height: 18px"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="white"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9 12h6M9 16h4"
                stroke="white"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div>
            <p class="font-bold text-sm text-black">Tus pedidos</p>
            <p class="text-red font-medium text-xs">
              ● {{ activeOrderCount }} en preparación
            </p>
          </div>
        </div>
        <span class="text-red font-bold text-lg">→</span>
      </NuxtLink>

      <div>
        <!-- Section header -->
        <div class="flex items-center justify-between mt-5 mb-3.5">
          <h2 class="font-display text-3xl tracking-[2.5px] text-black">
            {{ isSingleVendor ? "Menu" : "Food Trucks" }}
          </h2>
          <NuxtLink
            :to="isSingleVendor ? `/vendors/${vendors[0]?.id}` : '/vendors'"
          >
            <AppButton variant="ghost" size="small" class="text-sm font-light">
              {{ isSingleVendor ? "Ver menu →" : "Ver todos →" }}
            </AppButton>
          </NuxtLink>
        </div>

        <!-- Category pills -->
        <div
          v-if="!isSingleVendor"
          class="-mx-4 h-fit pb-2 flex gap-2 overflow-x-auto scrollbar-none px-4 mb-5"
        >
          <AppButton
            size="small"
            :key="'Todos'"
            :variant="selectedCategory === 'Todos' ? 'primary' : 'secondary'"
            @click="selectedCategory = 'Todos'"
          >
            Todos
          </AppButton>
          <AppButton
            v-for="cat in categories"
            size="small"
            :key="cat.id"
            :variant="selectedCategory === cat.label ? 'primary' : 'secondary'"
            @click="selectedCategory = cat.label"
          >
            {{ cat.emoji }} {{ cat.label }}
          </AppButton>
        </div>

        <!-- Trucks horizontal carousel -->
        <div
          class="flex gap-3.5 w-full overflow-x-auto scrollbar-none pb-1.5"
          :class="isSingleVendor ? '' : '-mx-4 px-4'"
        >
          <VendorCard
            v-for="vendor in filteredVendors"
            :key="vendor.id"
            :vendor="vendor"
            :class="isSingleVendor ? 'w-full mx-auto' : ''"
          />
          <div
            v-if="filteredVendors.length === 0"
            class="text-gray-400 text-sm py-4"
          >
            Sin resultados para esta categoría.
          </div>
        </div>
      </div>

      <!-- ── Venue map ──────────────────────────────────────────────────── -->
      <div class="mt-5">
        <div class="flex items-center justify-between mb-3.5">
          <h2 class="font-display text-3xl tracking-[2.5px] text-black">
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
      <p class="text-gray-500">
        No hay ningún festival activo por ahora. ¡Volvé pronto!
      </p>
    </div>
  </div>
</template>
