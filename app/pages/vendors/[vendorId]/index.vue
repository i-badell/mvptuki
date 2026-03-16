<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })

const route = useRoute()
const vendorId = route.params.vendorId as string

const { items, vendor, pending, error } = useMenu(vendorId)
const { cart, itemCount, cartTotal } = useCart()

// ── Category tabs ─────────────────────────────────────────────────────────────
// Tabs are derived from item names/descriptions once loaded.
// We fall back to a single "Menú" tab when no grouping data is available.
const activeSection = ref<string>('menu')
const sectionRefs = ref<Record<string, HTMLElement | null>>({})

// Group items by sort_order bands — each band of 100 becomes a section.
// If all share the same band, show a single "Menú" section.
const sections = computed(() => {
  if (!items.value.length) return []

  // Attempt to build sections from the first item's sort_order prefix (0–99, 100–199, …)
  // Since the data model has no category field, we respect sort_order grouping.
  const bands = new Map<number, typeof items.value>()
  for (const item of items.value) {
    const band = Math.floor(item.sort_order / 100) * 100
    if (!bands.has(band)) bands.set(band, [])
    bands.get(band)!.push(item)
  }

  if (bands.size <= 1) {
    // No meaningful grouping — single section
    return [{ id: 'menu', label: 'Menú', items: items.value }]
  }

  // Multiple bands → use first item's name of each band as section label
  return [...bands.entries()].map(([band, bandItems]) => ({
    id: `section-${band}`,
    label: bandItems[0]?.name.split(' ')[0] ?? 'Menú',
    items: bandItems,
  }))
})

function scrollToSection(id: string) {
  activeSection.value = id
  sectionRefs.value[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Observe which section is in view for tab highlighting
onMounted(() => {
  if (!import.meta.client) return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  )
  // Observe after a tick so refs are populated
  nextTick(() => {
    for (const el of Object.values(sectionRefs.value)) {
      if (el) observer.observe(el)
    }
  })
})

// ── Computed vendor info ──────────────────────────────────────────────────────
const isOpen = computed(() => vendor.value?.status === 'active')
const waitTime = computed(() => vendor.value?.requires_prep ? '~10' : '~5')
</script>

<template>
  <div class="min-h-screen bg-white font-sans" style="max-width: 390px; margin: 0 auto; padding-bottom: 88px;">

    <!-- ── Loading skeleton ───────────────────────────────────────────────── -->
    <template v-if="pending">
      <div class="bg-gray-900 animate-pulse" style="height: 220px;" />
      <div class="flex border-b border-gray-200">
        <div v-for="i in 4" :key="i" class="flex-1 py-4 px-3 flex flex-col items-center gap-1">
          <div class="h-5 w-10 bg-gray-100 rounded animate-pulse" />
          <div class="h-3 w-8 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div class="px-5 py-4 space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </template>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="text-center py-16 px-5">
      <p class="text-gray-400 text-sm mb-4">{{ error }}</p>
      <button class="text-red font-bold text-sm" @click="$router.back()">← Volver</button>
    </div>

    <!-- ── Content ────────────────────────────────────────────────────────── -->
    <template v-else-if="vendor">

      <!-- ── HERO ────────────────────────────────────────────────────────── -->
      <div class="relative overflow-hidden bg-black" style="height: 220px;">
        <!-- Dot texture -->
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 10px 10px;"
        />
        <!-- Red stripe decorations -->
        <div
          class="absolute rounded-lg"
          style="top: -40px; right: -30px; width: 260px; height: 340px; background: rgba(212,43,43,0.15); transform: rotate(-18deg);"
        />
        <div
          class="absolute rounded-lg"
          style="bottom: -60px; left: -40px; width: 200px; height: 200px; background: rgba(212,43,43,0.08); transform: rotate(12deg);"
        />

        <!-- Floating vendor emoji -->
        <div
          v-if="vendor.logo_url"
          class="absolute"
          style="right: 28px; bottom: 28px; opacity: 0.85;"
        >
          <NuxtImg :src="vendor.logo_url" :alt="vendor.name" class="w-20 h-20 rounded-xl object-cover" />
        </div>
        <div
          v-else
          class="absolute"
          style="right: 28px; bottom: 28px; font-size: 90px; line-height: 1; opacity: 0.85; animation: float 3s ease-in-out infinite;"
        >
          🍽️
        </div>

        <!-- Back button -->
        <button
          class="absolute flex items-center justify-center rounded-full text-white font-bold transition-colors active:bg-white/25"
          style="top: 16px; left: 16px; z-index: 10; width: 36px; height: 36px; background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.25); font-size: 16px; backdrop-filter: blur(4px);"
          aria-label="Volver"
          @click="$router.back()"
        >
          ←
        </button>

        <!-- Cart button -->
        <button
          class="absolute flex items-center justify-center rounded-full bg-red transition-transform active:scale-[0.91]"
          style="top: 16px; right: 16px; z-index: 10; width: 36px; height: 36px; border: none;"
          aria-label="Carrito"
          @click="navigateTo('/checkout')"
        >
          <svg style="width:17px;height:17px;fill:white;" viewBox="0 0 24 24">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
          </svg>
          <span
            v-if="itemCount > 0"
            class="absolute flex items-center justify-center bg-black text-white font-bold rounded-full"
            style="top: -4px; right: -4px; width: 16px; height: 16px; font-size: 9px;"
          >
            {{ itemCount }}
          </span>
        </button>

        <!-- Hero content (gradient overlay) -->
        <div
          class="absolute bottom-0 left-0 right-0 px-5"
          style="padding-bottom: 18px; padding-top: 20px; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);"
        >
          <!-- Status badge -->
          <div
            class="inline-flex items-center gap-1.5 text-white font-bold mb-2"
            style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 5px; padding: 3px 9px; font-size: 10px; backdrop-filter: blur(4px);"
          >
            <span
              class="rounded-full flex-shrink-0"
              :class="isOpen ? 'bg-success' : 'bg-gray-400'"
              style="width: 5px; height: 5px;"
            />
            {{ isOpen ? 'Abierto ahora' : 'Cerrado' }}
          </div>

          <!-- Vendor name -->
          <h1
            class="font-display text-white mb-1"
            style="font-size: 42px; line-height: 0.9; letter-spacing: 1px;"
          >
            {{ vendor.name }}
          </h1>

          <!-- Category / description -->
          <p class="text-white/60 uppercase tracking-[1.5px]" style="font-size: 11px;">
            {{ vendor.description ?? 'Food Truck' }}
          </p>
        </div>
      </div>

      <!-- ── INFO STRIP ───────────────────────────────────────────────────── -->
      <div class="flex bg-white" style="border-bottom: 1.5px solid #e8e8e8;">
        <div class="flex-1 flex flex-col items-center gap-[3px] text-center" style="padding: 14px 12px; border-right: 1.5px solid #e8e8e8;">
          <span class="font-display text-red" style="font-size: 22px; letter-spacing: 1px; line-height: 1;">★ 4.8</span>
          <span class="text-gray-500 uppercase" style="font-size: 9px; letter-spacing: 1px;">Rating</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-[3px] text-center" style="padding: 14px 12px; border-right: 1.5px solid #e8e8e8;">
          <span class="font-display text-black" style="font-size: 22px; letter-spacing: 1px; line-height: 1;">{{ waitTime }}</span>
          <span class="text-gray-500 uppercase" style="font-size: 9px; letter-spacing: 1px;">Min espera</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-[3px] text-center" style="padding: 14px 12px; border-right: 1.5px solid #e8e8e8;">
          <span class="font-display text-black" style="font-size: 22px; letter-spacing: 1px; line-height: 1;">{{ items.length }}</span>
          <span class="text-gray-500 uppercase" style="font-size: 9px; letter-spacing: 1px;">Items</span>
        </div>
        <div class="flex-1 flex flex-col items-center gap-[3px] text-center" style="padding: 14px 12px;">
          <span class="font-display text-black" style="font-size: 22px; letter-spacing: 1px; line-height: 1;">📍</span>
          <span class="text-gray-500 uppercase truncate w-full text-center" style="font-size: 9px; letter-spacing: 1px;">
            {{ vendor.location_hint ?? 'Mapa' }}
          </span>
        </div>
      </div>

      <!-- ── PAUSED BANNER ────────────────────────────────────────────────── -->
      <div
        v-if="!isOpen"
        class="mx-5 mt-4 rounded-md px-4 py-3 font-bold"
        style="background: #fff8f8; border: 1.5px solid #d42b2b; font-size: 13px; color: #d42b2b;"
      >
        ⚠️ Este food truck está cerrado y no acepta pedidos por ahora.
      </div>

      <!-- ── DESCRIPTION ──────────────────────────────────────────────────── -->
      <div
        v-if="vendor.description"
        class="px-5 py-4"
        style="border-bottom: 1.5px solid #e8e8e8;"
      >
        <p class="text-gray-700" style="font-size: 13px; line-height: 1.6;">{{ vendor.description }}</p>
      </div>

      <!-- ── CATEGORY TABS ────────────────────────────────────────────────── -->
      <div
        v-if="sections.length > 1"
        class="sticky bg-white scrollbar-none"
        style="top: 0; z-index: 50; border-bottom: 2px solid #111111;"
      >
        <div class="flex overflow-x-auto scrollbar-none px-5 gap-0">
          <button
            v-for="section in sections"
            :key="section.id"
            class="flex-shrink-0 font-bold uppercase transition-colors whitespace-nowrap"
            :class="activeSection === section.id ? 'text-red' : 'text-gray-500'"
            :style="{
              padding: '13px 18px',
              fontSize: '12px',
              letterSpacing: '0.3px',
              borderBottom: activeSection === section.id ? '2.5px solid #d42b2b' : '2.5px solid transparent',
              marginBottom: '-2px',
            }"
            @click="scrollToSection(section.id)"
          >
            {{ section.label }}
          </button>
        </div>
      </div>

      <!-- ── MENU ─────────────────────────────────────────────────────────── -->
      <div class="px-5">
        <template v-for="(section, idx) in sections" :key="section.id">
          <!-- Section label -->
          <div
            :id="section.id"
            :ref="(el) => { sectionRefs[section.id] = el as HTMLElement }"
            class="font-display text-black"
            style="font-size: 20px; letter-spacing: 2.5px; padding: 20px 0 12px; border-bottom: 1.5px solid #e8e8e8;"
          >
            {{ section.label }}
          </div>

          <!-- Items -->
          <MenuItemCard
            v-for="item in section.items"
            :key="item.id"
            :item="item"
            :vendor-id="vendorId"
            :vendor-name="vendor.name"
          />

          <!-- Section divider -->
          <div
            v-if="idx < sections.length - 1"
            class="-mx-5 mt-1"
            style="height: 8px; background: #f8f8f8; border-top: 1.5px solid #e8e8e8; border-bottom: 1.5px solid #e8e8e8;"
          />
        </template>

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
        class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-overlay"
        style="padding: 12px 20px 20px;"
      >
        <button
          class="w-full flex items-center justify-between px-[18px] py-[14px] rounded-lg transition-transform active:scale-[0.98]"
          style="background: #111111; box-shadow: 0 8px 32px rgba(0,0,0,0.28); border: 1.5px solid #111111;"
          @click="navigateTo('/checkout')"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex items-center justify-center bg-red text-white font-bold rounded-full flex-shrink-0"
              style="width: 28px; height: 28px; font-size: 13px;"
            >
              {{ itemCount }}
            </span>
            <span class="font-display text-white" style="font-size: 18px; letter-spacing: 2px;">Ver carrito</span>
          </div>
          <span class="font-display text-white" style="font-size: 20px; letter-spacing: 1px;">${{ cartTotal.toFixed(0) }}</span>
        </button>
      </div>
    </Transition>

    <AppToast />
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
</style>
