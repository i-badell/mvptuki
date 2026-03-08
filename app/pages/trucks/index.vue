<script setup lang="ts">
import type { VendorWithFeaturedItems } from '~~/shared/types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { festival, vendors, pending } = useFestival()

// ── View tab ─────────────────────────────────────────────────────────────────
const activeTab = ref<'list' | 'map'>('list')

// ── Search ───────────────────────────────────────────────────────────────────
const query = ref('')

// ── Category pills ───────────────────────────────────────────────────────────
const PILLS = ['🍽️ Todos', '🍔 Burgers', '🌮 Street', '🍕 Pizza', '🍜 Ramen', '🌱 Vegano', '🍺 Bebidas']
const PILL_KEYS: Record<string, string[]> = {
  '🍔 Burgers': ['burger', 'hamburgue', 'smash'],
  '🌮 Street':  ['taco', 'mexic', 'street'],
  '🍕 Pizza':   ['pizza', 'fornac', 'napol'],
  '🍜 Ramen':   ['ramen', 'noodle', 'asian'],
  '🌱 Vegano':  ['vegan', 'vegano', 'plant', 'verde'],
  '🍺 Bebidas': ['beer', 'cervez', 'drink', 'bebid', 'bar'],
}
const selectedPill = ref('🍽️ Todos')

// ── Filtered list ────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = vendors.value
  // search
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    list = list.filter((v) =>
      v.name.toLowerCase().includes(q) || (v.description ?? '').toLowerCase().includes(q),
    )
  }
  // pill
  if (selectedPill.value !== '🍽️ Todos') {
    const kws = PILL_KEYS[selectedPill.value] ?? []
    list = list.filter((v) => {
      const hay = `${v.name} ${v.description ?? ''}`.toLowerCase()
      return kws.some((k) => hay.includes(k))
    })
  }
  return list
})

// ── Card colours (rotate from palette) ───────────────────────────────────────
const PALETTE = ['#d42b2b', '#1a1a1a', '#1e3a5f', '#166534', '#1e293b', '#7c2d12']
function cardColor(vendor: VendorWithFeaturedItems) {
  return PALETTE[vendor.name.charCodeAt(0) % PALETTE.length]
}

// ── Min price from featured items ─────────────────────────────────────────────
function priceRange(vendor: VendorWithFeaturedItems) {
  if (!vendor.menu_items.length) return null
  const prices = vendor.menu_items.map((i) => i.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? `$${min.toFixed(0)}` : `$${min.toFixed(0)} – $${max.toFixed(0)}`
}
</script>

<template>
  <div class="-mx-4 -mt-4">

    <!-- ── Loading ──────────────────────────────────────────────────────────── -->
    <template v-if="pending">
      <div class="px-5 pt-5 pb-3 space-y-1">
        <div class="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        <div class="h-9 w-40 bg-gray-100 rounded animate-pulse" />
        <div class="h-3 w-48 bg-gray-100 rounded animate-pulse" />
      </div>
      <div class="flex gap-2 px-5 mb-4">
        <div class="flex-1 h-10 bg-gray-100 rounded-lg animate-pulse" />
        <div class="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div class="px-5 flex flex-col gap-2.5">
        <div v-for="i in 4" :key="i" class="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </template>

    <template v-else>
      <!-- ── Page title ─────────────────────────────────────────────────────── -->
      <div class="px-5 pt-5 pb-0">
        <p class="font-bold uppercase text-red mb-1" style="font-size: 10px; letter-spacing: 2px;">
          {{ festival?.name ?? 'Festival' }} · {{ new Date().getFullYear() }}
        </p>
        <h1 class="font-display text-black leading-[0.9]" style="font-size: 38px; letter-spacing: 2px;">
          FOOD<br><span class="font-serif italic text-red not-italic" style="font-size: 28px; font-style: italic;">Trucks</span>
        </h1>
        <p class="text-gray-500 mt-1.5" style="font-size: 12px;">
          {{ vendors.length }} puestos · {{ festival?.description ?? 'Hoy en el festival' }}
        </p>
      </div>

      <!-- ── Tab switcher ──────────────────────────────────────────────────── -->
      <div
        class="flex mx-5 mt-4"
        style="background: #f0f0f0; border: 1.5px solid #111111; border-radius: 12px; padding: 4px; box-shadow: var(--shadow-sm);"
      >
        <button
          class="flex-1 flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all"
          :class="activeTab === 'list' ? 'bg-black text-white' : 'text-gray-500'"
          style="padding: 9px 8px; font-size: 12px;"
          :style="activeTab === 'list' ? 'box-shadow: 2px 2px 0 #aa1f1f;' : ''"
          @click="activeTab = 'list'"
        >
          <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" :stroke="activeTab === 'list' ? 'white' : '#888'" stroke-width="2" stroke-linecap="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <circle cx="3" cy="6" r="1" :fill="activeTab === 'list' ? 'white' : '#888'" stroke="none"/>
            <circle cx="3" cy="12" r="1" :fill="activeTab === 'list' ? 'white' : '#888'" stroke="none"/>
            <circle cx="3" cy="18" r="1" :fill="activeTab === 'list' ? 'white' : '#888'" stroke="none"/>
          </svg>
          Lista
        </button>
        <button
          class="flex-1 flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all"
          :class="activeTab === 'map' ? 'bg-black text-white' : 'text-gray-500'"
          style="padding: 9px 8px; font-size: 12px;"
          :style="activeTab === 'map' ? 'box-shadow: 2px 2px 0 #aa1f1f;' : ''"
          @click="activeTab = 'map'"
        >
          <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" :stroke="activeTab === 'map' ? 'white' : '#888'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Mapa
        </button>
      </div>

      <!-- ── Search + filter ────────────────────────────────────────────────── -->
      <div class="flex gap-2 px-5 pt-3.5 pb-2.5">
        <div class="flex-1 relative">
          <svg
            class="absolute text-gray-400"
            style="left: 11px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px;"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="query"
            type="text"
            placeholder="Buscar un truck..."
            class="w-full bg-gray-100 text-black outline-none transition-colors placeholder:text-gray-400 focus:border-black"
            style="border: 1.5px solid #e8e8e8; border-radius: 10px; padding: 9px 12px 9px 32px; font-size: 13px; font-family: inherit;"
          >
        </div>
        <button
          class="flex items-center justify-center flex-shrink-0 bg-white transition-all active:translate-x-[2px] active:translate-y-[2px]"
          style="width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid #111111; box-shadow: 2px 2px 0 #111111;"
        >
          <svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- ── Category pills ─────────────────────────────────────────────────── -->
      <div class="flex gap-1.5 overflow-x-auto scrollbar-none px-5 pb-3.5">
        <button
          v-for="pill in PILLS"
          :key="pill"
          class="inline-flex items-center gap-1 whitespace-nowrap font-bold transition-all"
          :class="selectedPill === pill ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'"
          :style="{
            padding: '6px 13px',
            borderRadius: '9999px',
            border: '1.5px solid',
            fontSize: '11px',
            boxShadow: selectedPill === pill ? '2px 2px 0 #aa1f1f' : '2px 2px 0 #e4e4dc',
          }"
          @click="selectedPill = pill"
        >
          {{ pill }}
        </button>
      </div>

      <!-- ══════════════════════
           LIST VIEW
      ══════════════════════ -->
      <div v-if="activeTab === 'list'" class="px-5 flex flex-col gap-2.5 pb-4">

        <div v-if="!filtered.length" class="text-center py-12 text-gray-400" style="font-size: 13px;">
          Sin resultados para "{{ query || selectedPill }}"
        </div>

        <NuxtLink
          v-for="(vendor, idx) in filtered"
          :key="vendor.id"
          :to="vendor.status === 'paused' ? '#' : `/vendor/${vendor.id}`"
          class="block bg-white rounded-xl overflow-hidden transition-all active:translate-x-[2px] active:translate-y-[2px]"
          :class="vendor.status === 'paused' ? 'opacity-60 pointer-events-none' : ''"
          :style="{
            border: '1.5px solid #111111',
            boxShadow: '4px 4px 0 #111111',
            animationDelay: `${idx * 0.05}s`,
          }"
          style="animation: fadeUp 0.4s ease both;"
        >
          <!-- Card header (coloured band) -->
          <div
            class="relative overflow-hidden flex items-center justify-between px-4"
            :style="{ background: cardColor(vendor), height: '72px' }"
          >
            <!-- Dot texture -->
            <div
              class="absolute inset-0"
              style="background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px); background-size: 14px 14px; pointer-events: none;"
            />
            <!-- Diagonal stripe -->
            <div
              class="absolute rounded-sm"
              style="top: -20px; right: -20px; width: 120px; height: 120px; background: rgba(255,255,255,0.07); transform: rotate(-20deg);"
            />
            <!-- Emoji -->
            <span class="relative z-10 filter drop-shadow-sm" style="font-size: 38px;">🍽️</span>
            <!-- Right: wait + location -->
            <div class="relative z-10 text-right">
              <span
                v-if="vendor.status === 'active' && vendor.requires_prep"
                class="inline-block font-bold rounded-[6px] bg-white mb-1"
                :style="{ color: cardColor(vendor), fontSize: '10px', padding: '3px 8px', border: '1px solid rgba(0,0,0,0.15)' }"
              >
                ~10 min
              </span>
              <span
                v-else-if="vendor.status === 'active'"
                class="inline-block font-bold rounded-[6px] bg-white mb-1"
                :style="{ color: cardColor(vendor), fontSize: '10px', padding: '3px 8px', border: '1px solid rgba(0,0,0,0.15)' }"
              >
                ~5 min
              </span>
              <span
                v-if="vendor.location_hint"
                class="block font-bold text-white/80"
                style="font-size: 9px;"
              >
                📍 {{ vendor.location_hint }}
              </span>
            </div>
          </div>

          <!-- Card body -->
          <div class="px-4 py-3">
            <!-- Name + rating -->
            <div class="flex items-start justify-between mb-1.5">
              <p class="font-serif font-bold text-black" style="font-size: 16px; line-height: 1.2;">{{ vendor.name }}</p>
              <span
                class="font-bold rounded-[6px] flex-shrink-0 ml-2"
                style="font-size: 11px; background: #f0f0f0; border: 1px solid #e8e8e8; padding: 3px 8px; color: #111;"
              >
                ★ 4.8
              </span>
            </div>
            <!-- Description -->
            <p v-if="vendor.description" class="text-gray-500 mb-2.5" style="font-size: 12px; line-height: 1.5;">
              {{ vendor.description }}
            </p>
            <!-- Featured item tags -->
            <div v-if="vendor.menu_items.length" class="flex gap-1.5 flex-wrap mb-3">
              <span
                v-for="item in vendor.menu_items.slice(0, 3)"
                :key="item.id"
                class="font-semibold text-black"
                style="font-size: 10px; background: #f0f0f0; border: 1px solid #e8e8e8; border-radius: 5px; padding: 2px 8px;"
              >
                {{ item.name }}
              </span>
            </div>
            <!-- Footer: price range + status + CTA -->
            <div class="flex items-center justify-between pt-2.5" style="border-top: 1px solid #e8e8e8;">
              <span v-if="priceRange(vendor)" class="font-semibold text-gray-500" style="font-size: 12px;">
                {{ priceRange(vendor) }}
              </span>
              <span v-else class="font-semibold text-gray-500" style="font-size: 12px;">Food Truck</span>
              <div class="flex items-center gap-2.5">
                <!-- Status -->
                <div
                  class="flex items-center gap-1 font-bold"
                  :class="vendor.status === 'active' ? 'text-green-700' : 'text-gray-400'"
                  style="font-size: 11px;"
                >
                  <span
                    class="rounded-full flex-shrink-0"
                    :class="vendor.status === 'active' ? 'bg-success' : 'bg-gray-400'"
                    style="width: 7px; height: 7px;"
                  />
                  {{ vendor.status === 'active' ? 'Abierto' : 'Cerrado' }}
                </div>
                <!-- CTA button -->
                <span
                  class="font-bold text-white rounded-lg transition-all"
                  :class="vendor.status === 'paused' ? 'bg-gray-300 cursor-default' : 'bg-red'"
                  style="font-size: 12px; padding: 7px 16px; border: 1.5px solid; border-color: inherit; box-shadow: 2px 2px 0 #aa1f1f;"
                  :style="vendor.status === 'paused' ? 'border-color: #d0d0d0; box-shadow: 2px 2px 0 #d0d0d0;' : 'border-color: #aa1f1f;'"
                >
                  {{ vendor.status === 'paused' ? 'No disponible' : 'Ver menú →' }}
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <!-- ══════════════════════
           MAP VIEW
      ══════════════════════ -->
      <div v-else class="px-5 pb-4">
        <!-- Map box -->
        <div
          class="rounded-xl overflow-hidden bg-gray-50"
          style="border: 2px solid #111111; box-shadow: 5px 5px 0 #111111;"
        >
          <!-- Festival map image or placeholder SVG -->
          <div class="relative" style="aspect-ratio: 350/300; width: 100%;">
            <NuxtImg
              v-if="festival?.map_url"
              :src="festival.map_url"
              alt="Mapa del festival"
              class="w-full h-full object-cover"
            />

            <!-- Placeholder map SVG (when no map_url) -->
            <svg
              v-else
              viewBox="0 0 350 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="w-full h-full"
            >
              <rect width="350" height="300" fill="#faf9f6"/>
              <!-- Grid -->
              <line x1="0" y1="100" x2="350" y2="100" stroke="#e4e4dc" stroke-width="1"/>
              <line x1="0" y1="200" x2="350" y2="200" stroke="#e4e4dc" stroke-width="1"/>
              <line x1="116" y1="0" x2="116" y2="300" stroke="#e4e4dc" stroke-width="1"/>
              <line x1="232" y1="0" x2="232" y2="300" stroke="#e4e4dc" stroke-width="1"/>
              <!-- Zone labels -->
              <rect x="10" y="10" width="52" height="20" rx="4" fill="#111111"/>
              <text x="36" y="24" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="10" letter-spacing="1" fill="white">ZONA A</text>
              <rect x="128" y="10" width="52" height="20" rx="4" fill="#111111"/>
              <text x="154" y="24" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="10" letter-spacing="1" fill="white">ZONA B</text>
              <rect x="242" y="10" width="52" height="20" rx="4" fill="#111111"/>
              <text x="268" y="24" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="10" letter-spacing="1" fill="white">ZONA C</text>
              <!-- Stage -->
              <rect x="30" y="245" width="290" height="44" rx="6" fill="#111111"/>
              <text x="175" y="265" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="11" letter-spacing="2" fill="white">ESCENARIO PRINCIPAL</text>
              <text x="175" y="279" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="rgba(255,255,255,0.5)">Acceso por Av. Principal</text>
              <!-- Entrance -->
              <rect x="148" y="215" width="54" height="20" rx="4" fill="#e4e4dc"/>
              <text x="175" y="228" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#888878">ENTRADA</text>
              <line x1="175" y1="200" x2="175" y2="215" stroke="#e4e4dc" stroke-width="2" stroke-dasharray="4 4"/>
              <!-- Paths -->
              <path d="M58 100 Q58 150 58 200" stroke="#e8e8e0" stroke-width="12" stroke-linecap="round" fill="none"/>
              <path d="M175 50 Q175 75 175 100" stroke="#e8e8e0" stroke-width="12" stroke-linecap="round" fill="none"/>
              <path d="M290 100 Q290 150 290 190" stroke="#e8e8e0" stroke-width="12" stroke-linecap="round" fill="none"/>
              <path d="M30 150 Q175 150 320 150" stroke="#e8e8e0" stroke-width="12" stroke-linecap="round" fill="none"/>
              <!-- Vendor pins -->
              <g
                v-for="(vendor, i) in vendors.slice(0, 5)"
                :key="vendor.id"
              />
              <!-- Static pins for demo layout -->
              <g v-for="(pin, i) in [
                { x: 62, y: 65, label: '1' },
                { x: 175, y: 65, label: '2' },
                { x: 62, y: 170, label: '3' },
                { x: 290, y: 130, label: '4' },
                { x: 175, y: 170, label: '5' },
              ]" :key="i">
                <circle :cx="pin.x" :cy="pin.y" r="18"
                  :fill="vendors[i]?.status === 'paused' ? '#888878' : (i === 0 ? '#d42b2b' : '#1a1a1a')"
                  stroke="#111" stroke-width="2"/>
                <text :x="pin.x" :y="pin.y + 5" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="12" fill="white">{{ pin.label }}</text>
              </g>
              <!-- Info center -->
              <circle cx="175" cy="150" r="10" fill="white" stroke="#111" stroke-width="1.5"/>
              <text x="175" y="154" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="10" fill="#111">ℹ</text>
            </svg>
          </div>

          <!-- Map legend -->
          <div class="flex flex-wrap gap-3.5 px-4 py-3" style="border-top: 1.5px solid #e8e8e8;">
            <div class="flex items-center gap-1.5 font-semibold text-gray-500" style="font-size: 10px;">
              <span class="rounded-full" style="width:10px;height:10px;background:#d42b2b;border:1.5px solid #111;flex-shrink:0;"/>
              Alta demanda
            </div>
            <div class="flex items-center gap-1.5 font-semibold text-gray-500" style="font-size: 10px;">
              <span class="rounded-full" style="width:10px;height:10px;background:#1a1a1a;border:1.5px solid #111;flex-shrink:0;"/>
              Abierto
            </div>
            <div class="flex items-center gap-1.5 font-semibold text-gray-500" style="font-size: 10px;">
              <span class="rounded-full" style="width:10px;height:10px;background:#888878;border:1.5px solid #111;flex-shrink:0;"/>
              Cerrado
            </div>
          </div>
        </div>

        <!-- Map truck list -->
        <div class="flex flex-col gap-2 mt-3.5">
          <NuxtLink
            v-for="(vendor, i) in vendors"
            :key="vendor.id"
            :to="vendor.status === 'paused' ? '#' : `/vendor/${vendor.id}`"
            class="flex items-center gap-2.5 bg-white rounded-xl px-3.5 py-2.5 transition-all active:translate-x-[2px] active:translate-y-[2px]"
            :class="[vendor.status === 'paused' ? 'opacity-50 pointer-events-none' : '']"
            style="border: 1.5px solid #111111; box-shadow: 3px 3px 0 #111111;"
          >
            <!-- Pin number -->
            <div
              class="flex items-center justify-center rounded-full font-display text-white flex-shrink-0"
              :style="{ background: vendor.status === 'paused' ? '#888878' : cardColor(vendor), width: '28px', height: '28px', border: '2px solid #111', boxShadow: '2px 2px 0 #111', fontSize: '13px' }"
            >
              {{ i + 1 }}
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-serif font-bold text-black" style="font-size: 13px; margin-bottom: 1px;">{{ vendor.name }}</p>
              <p class="text-gray-500 truncate" style="font-size: 10px;">
                {{ vendor.location_hint ?? 'Food Truck' }}
                <template v-if="vendor.description"> · {{ vendor.description }}</template>
              </p>
            </div>
            <!-- Wait -->
            <span class="font-bold text-black flex-shrink-0" style="font-size: 10px;">
              {{ vendor.status === 'paused' ? 'Cerrado' : vendor.requires_prep ? '~10 min' : '~5 min' }}
            </span>
          </NuxtLink>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
