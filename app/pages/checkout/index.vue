<script setup lang="ts">
import type { PaymentPreferenceResponse } from "~~/shared/types";

definePageMeta({ layout: false, middleware: "auth" });

const { cart, cartTotal, updateQuantity, removeItem } = useCart();
const toast = useToast();
const supabase = useSupabaseClient();

const step = ref(1);
const notes = ref("");
const loading = ref(false);
const vendor = ref<{
  name: string;
  location_hint: string | null;
  requires_prep: boolean;
} | null>(null);

const itemCount = computed(
  () => cart.value?.items.reduce((s, i) => s + i.quantity, 0) ?? 0,
);

onMounted(async () => {
  if (!cart.value?.items.length) {
    navigateTo("/festival");
    return;
  }
  const { data } = await supabase
    .from("vendors")
    .select("name, location_hint, requires_prep")
    .eq("id", cart.value.vendorId)
    .single();
  vendor.value = data;
});

function handleQty(menuItemId: string, current: number, delta: number) {
  const next = current + delta;
  if (next <= 0) {
    removeItem(menuItemId);
  } else {
    updateQuantity(menuItemId, next);
  }
}

async function pay() {
  if (!cart.value) return;
  loading.value = true;
  try {
    const result = await $fetch<PaymentPreferenceResponse>(
      "/api/payment/preference",
      {
        method: "POST",
        body: {
          vendorId: cart.value.vendorId,
          items: cart.value.items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            name: i.name,
          })),
        },
      },
    );
    window.location.href = result.initPoint;
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : "No se pudo iniciar el pago. Intentá de nuevo.",
    );
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <!-- ══════════════════════════════
         SCREEN 1: CARRITO
    ══════════════════════════════ -->
    <template v-if="step === 1">
      <!-- Header -->
      <header
        class="bg-white flex items-center gap-3 px-5"
        style="
          border-bottom: 2px solid #111111;
          padding-top: 13px;
          padding-bottom: 13px;
        "
      >
        <button
          class="flex items-center justify-center rounded-full bg-gray-50 transition-colors active:bg-gray-200 flex-shrink-0"
          style="
            width: 34px;
            height: 34px;
            border: 1.5px solid #111111;
            font-size: 15px;
            font-weight: 700;
            color: #111;
          "
          aria-label="Volver"
          @click="$router.back()"
        >
          ←
        </button>
        <div class="flex-1">
          <h1
            class="font-display text-black leading-none"
            style="font-size: 26px; letter-spacing: 3px"
          >
            Mi Carrito
          </h1>
          <p
            class="text-gray-500 uppercase tracking-[1.2px] mt-px"
            style="font-size: 10px"
          >
            {{ cart?.vendorName ?? "Festival" }}
          </p>
        </div>
      </header>

      <!-- Step bar -->
      <div
        class="bg-white flex items-center px-5"
        style="
          padding-top: 10px;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #e8e8e8;
        "
      >
        <div class="flex items-center gap-1.5 flex-1">
          <div
            class="flex items-center justify-center rounded-full bg-red text-white font-bold flex-shrink-0"
            style="
              width: 22px;
              height: 22px;
              border: 2px solid #d42b2b;
              font-size: 10px;
            "
          >
            1
          </div>
          <span
            class="font-semibold text-red uppercase"
            style="font-size: 10px; letter-spacing: 0.3px"
            >Carrito</span
          >
        </div>
        <div class="flex-1 mx-1.5" style="height: 2px; background: #e8e8e8" />
        <div class="flex items-center gap-1.5 flex-1">
          <div
            class="flex items-center justify-center rounded-full text-gray-400 font-bold flex-shrink-0"
            style="
              width: 22px;
              height: 22px;
              border: 2px solid #e8e8e8;
              font-size: 10px;
            "
          >
            2
          </div>
          <span
            class="font-semibold text-gray-400 uppercase"
            style="font-size: 10px; letter-spacing: 0.3px"
            >Pago</span
          >
        </div>
      </div>

      <!-- Truck strip -->
      <div
        v-if="vendor || cart"
        class="mx-5 mt-4 bg-white flex items-center gap-3 px-4 py-3 rounded-lg"
        style="border: 1.5px solid #111111; box-shadow: var(--shadow-sm)"
      >
        <div
          class="flex items-center justify-center rounded-[9px] bg-black flex-shrink-0"
          style="width: 40px; height: 40px; font-size: 20px"
        >
          🍽️
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-serif font-bold text-black" style="font-size: 15px">
            {{ vendor?.name ?? cart?.vendorName }}
          </p>
          <p class="text-gray-500 mt-px" style="font-size: 11px">
            {{ vendor?.location_hint ?? "Food Truck" }}
          </p>
        </div>
        <div
          v-if="vendor?.requires_prep"
          class="text-red font-bold flex-shrink-0 rounded-[6px] px-2"
          style="
            background: #fff8f8;
            border: 1.5px solid #d42b2b;
            font-size: 10px;
            padding-top: 4px;
            padding-bottom: 4px;
          "
        >
          ~10 min
        </div>
      </div>

      <!-- Cart items -->
      <div
        class="mx-5 mt-4 bg-white rounded-lg overflow-hidden"
        style="border: 1.5px solid #111111; box-shadow: var(--shadow-md)"
      >
        <p
          class="font-display text-gray-400 uppercase px-4"
          style="
            font-size: 14px;
            letter-spacing: 2px;
            padding-top: 12px;
            padding-bottom: 8px;
            border-bottom: 1.5px solid #e8e8e8;
          "
        >
          Tus items
        </p>

        <div v-if="cart?.items.length">
          <div
            v-for="item in cart.items"
            :key="item.menuItemId"
            class="flex items-center gap-3 px-4"
            style="
              padding-top: 14px;
              padding-bottom: 14px;
              border-bottom: 1px solid #f0f0f0;
            "
          >
            <!-- Qty control -->
            <div
              class="flex items-center flex-shrink-0 overflow-hidden"
              style="border: 1.5px solid #111111; border-radius: 8px"
            >
              <button
                class="flex items-center justify-center bg-white text-black font-bold transition-colors active:bg-gray-100"
                style="width: 28px; height: 28px; border: none; font-size: 16px"
                @click="handleQty(item.menuItemId, item.quantity, -1)"
              >
                −
              </button>
              <span
                class="text-center font-bold text-black"
                style="
                  min-width: 26px;
                  font-size: 13px;
                  border-left: 1px solid #e8e8e8;
                  border-right: 1px solid #e8e8e8;
                  line-height: 28px;
                "
              >
                {{ item.quantity }}
              </span>
              <button
                class="flex items-center justify-center bg-red text-white font-bold transition-colors active:bg-red-dark"
                style="width: 28px; height: 28px; border: none; font-size: 16px"
                @click="handleQty(item.menuItemId, item.quantity, 1)"
              >
                +
              </button>
            </div>

            <!-- Item info -->
            <div class="flex-1 min-w-0">
              <p
                class="font-bold text-black"
                style="font-size: 14px; margin-bottom: 2px"
              >
                {{ item.name }}
              </p>
              <p class="text-gray-500 truncate" style="font-size: 11px">
                ${{ item.unitPrice.toFixed(0) }} c/u
              </p>
            </div>

            <!-- Line total -->
            <span
              class="font-display text-black flex-shrink-0"
              style="font-size: 20px"
            >
              ${{ (item.unitPrice * item.quantity).toFixed(0) }}
            </span>

            <!-- Remove -->
            <button
              class="flex items-center justify-center rounded-full flex-shrink-0 transition-colors active:bg-red-light active:border-red"
              style="
                width: 24px;
                height: 24px;
                background: #f8f8f8;
                border: 1.5px solid #e8e8e8;
                font-size: 11px;
                color: #888;
              "
              aria-label="Eliminar item"
              @click="removeItem(item.menuItemId)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Add more items -->
      <button
        class="mx-5 mt-3 flex items-center gap-2 bg-transparent transition-colors active:bg-red-light rounded-[10px] w-[calc(100%-40px)]"
        style="border: 1.5px dashed #d42b2b; padding: 11px 16px"
        @click="$router.back()"
      >
        <span
          class="flex items-center justify-center rounded-[6px] bg-red text-white flex-shrink-0"
          style="width: 26px; height: 26px; font-size: 16px"
          >+</span
        >
        <span class="font-bold text-red" style="font-size: 13px"
          >Agregar más items</span
        >
      </button>

      <!-- Desglose -->
      <div
        class="mx-5 mt-4 bg-white rounded-lg overflow-hidden"
        style="border: 1.5px solid #111111; box-shadow: var(--shadow-md)"
      >
        <p
          class="font-display text-gray-400 uppercase px-4"
          style="
            font-size: 14px;
            letter-spacing: 2px;
            padding-top: 12px;
            padding-bottom: 8px;
            border-bottom: 1.5px solid #e8e8e8;
          "
        >
          Desglose
        </p>
        <div
          class="flex justify-between items-center px-4"
          style="
            padding-top: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
          "
        >
          <span class="text-gray-500" style="font-size: 13px"
            >Subtotal ({{ itemCount }}
            {{ itemCount === 1 ? "item" : "items" }})</span
          >
          <span class="font-semibold text-black" style="font-size: 13px"
            >${{ cartTotal.toFixed(0) }}</span
          >
        </div>
        <div
          class="flex justify-between items-center px-4"
          style="
            padding-top: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #f0f0f0;
          "
        >
          <span class="text-gray-500" style="font-size: 13px"
            >Cargo por servicio</span
          >
          <span class="font-semibold text-black" style="font-size: 13px"
            >$0</span
          >
        </div>
        <div
          class="flex justify-between items-center px-4 bg-gray-50"
          style="
            padding-top: 13px;
            padding-bottom: 13px;
            border-top: 1.5px solid #111111;
          "
        >
          <span
            class="font-display text-black"
            style="font-size: 18px; letter-spacing: 1.5px"
            >Total</span
          >
          <span
            class="font-display text-black"
            style="font-size: 26px; letter-spacing: 1px"
            >${{ cartTotal.toFixed(0) }}</span
          >
        </div>
      </div>

      <!-- Nota para el truck -->
      <div class="mx-5 mt-4">
        <p
          class="text-gray-500 uppercase font-bold mb-1.5"
          style="font-size: 11px; letter-spacing: 1px"
        >
          Nota para el truck (opcional)
        </p>
        <textarea
          v-model="notes"
          class="w-full bg-white text-black outline-none resize-none rounded-[10px] px-3.5 py-3 transition-colors focus:border-black placeholder:text-gray-300"
          style="
            border: 1.5px solid #e8e8e8;
            font-size: 13px;
            font-family: inherit;
            height: 68px;
          "
          placeholder="Ej: sin pickle en la segunda burger, extra salsa..."
        />
      </div>

      <!-- MP pay button -->
      <div class="px-5 pt-4 pb-8">
        <button
          class="w-full flex items-center justify-between px-[18px] transition-all active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-60"
          style="
            background: #009ee3;
            border: 2px solid #007ab8;
            border-radius: 12px;
            box-shadow: var(--shadow-mp);
            height: 58px;
          "
          :style="loading ? 'box-shadow: 1px 1px 0 #007ab8;' : ''"
          :disabled="loading || !cart?.items.length"
          @click="step = 2"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="rounded-[6px] bg-white font-black flex-shrink-0"
              style="
                padding: 3px 7px;
                font-family: &quot;Arial Black&quot;, sans-serif;
                font-size: 13px;
                color: #009ee3;
                letter-spacing: -0.5px;
              "
            >
              MP
            </span>
            <span class="font-bold text-white" style="font-size: 14px"
              >Pagar con Mercado Pago</span
            >
          </div>
          <span
            class="font-display text-white"
            style="font-size: 22px; letter-spacing: 1px"
            >${{ cartTotal.toFixed(0) }} →</span
          >
        </button>
        <div
          class="flex items-center justify-center gap-1.5 mt-2.5 text-gray-400"
          style="font-size: 11px"
        >
          🔒 Pago seguro procesado por Mercado Pago
        </div>
      </div>
    </template>

    <!-- ══════════════════════════════
         SCREEN 2: MP REDIRECT
    ══════════════════════════════ -->
    <template v-else>
      <!-- Header -->
      <header
        class="bg-white flex items-center gap-3 px-5"
        style="
          border-bottom: 2px solid #111111;
          padding-top: 13px;
          padding-bottom: 13px;
        "
      >
        <button
          class="flex items-center justify-center rounded-full bg-gray-50 transition-colors active:bg-gray-200 flex-shrink-0"
          style="
            width: 34px;
            height: 34px;
            border: 1.5px solid #111111;
            font-size: 15px;
            font-weight: 700;
            color: #111;
          "
          aria-label="Volver al carrito"
          @click="step = 1"
        >
          ←
        </button>
        <div class="flex-1">
          <h1
            class="font-display text-black leading-none"
            style="font-size: 26px; letter-spacing: 3px"
          >
            Pagar
          </h1>
          <p
            class="text-gray-500 uppercase tracking-[1.2px] mt-px"
            style="font-size: 10px"
          >
            Mercado Pago
          </p>
        </div>
      </header>

      <!-- Step bar -->
      <div
        class="bg-white flex items-center px-5"
        style="
          padding-top: 10px;
          padding-bottom: 10px;
          border-bottom: 1.5px solid #e8e8e8;
        "
      >
        <div class="flex items-center gap-1.5 flex-1">
          <div
            class="flex items-center justify-center rounded-full bg-black text-white font-bold flex-shrink-0"
            style="
              width: 22px;
              height: 22px;
              border: 2px solid #111;
              font-size: 10px;
            "
          >
            ✓
          </div>
          <span
            class="font-semibold text-black uppercase"
            style="font-size: 10px; letter-spacing: 0.3px"
            >Carrito</span
          >
        </div>
        <div class="flex-1 mx-1.5" style="height: 2px; background: #111111" />
        <div class="flex items-center gap-1.5 flex-1">
          <div
            class="flex items-center justify-center rounded-full bg-red text-white font-bold flex-shrink-0"
            style="
              width: 22px;
              height: 22px;
              border: 2px solid #d42b2b;
              font-size: 10px;
            "
          >
            2
          </div>
          <span
            class="font-semibold text-red uppercase"
            style="font-size: 10px; letter-spacing: 0.3px"
            >Pago</span
          >
        </div>
      </div>

      <!-- MP content -->
      <div class="px-5 pt-7 pb-8 flex flex-col items-center text-center">
        <!-- MP big icon -->
        <div
          class="flex items-center justify-center mb-[22px] flex-shrink-0"
          style="
            width: 90px;
            height: 90px;
            background: #009ee3;
            border: 2px solid #007ab8;
            border-radius: 22px;
            box-shadow: 5px 5px 0 #007ab8;
          "
        >
          <span
            style="
              font-family: &quot;Arial Black&quot;, sans-serif;
              font-size: 28px;
              font-weight: 900;
              color: white;
              letter-spacing: -1px;
            "
            >MP</span
          >
        </div>

        <h2
          class="font-display text-black mb-1.5"
          style="font-size: 30px; letter-spacing: 2px"
        >
          Pagar con Mercado Pago
        </h2>
        <p
          class="text-gray-500 mb-6"
          style="font-size: 13px; line-height: 1.6; max-width: 280px"
        >
          Serás redirigido a Mercado Pago para completar el pago de forma segura
          con tus métodos guardados.
        </p>

        <!-- Amount box -->
        <div
          class="w-full bg-white mb-5 text-left rounded-lg px-5 py-[18px]"
          style="border: 1.5px solid #111111; box-shadow: var(--shadow-md)"
        >
          <p
            class="text-gray-500 uppercase mb-1.5"
            style="font-size: 11px; letter-spacing: 1.2px"
          >
            Total a pagar
          </p>
          <p
            class="font-display text-black leading-none"
            style="font-size: 52px; letter-spacing: 2px"
          >
            ${{ cartTotal.toFixed(0) }}
          </p>
          <div
            class="flex items-center justify-center gap-1.5 mt-1.5"
            style="font-size: 12px; color: #888"
          >
            <span
              class="rounded-full bg-success"
              style="width: 5px; height: 5px; flex-shrink: 0"
            />
            {{ vendor?.name ?? cart?.vendorName }}
            <template v-if="vendor?.location_hint">
              · {{ vendor.location_hint }}</template
            >
          </div>
        </div>

        <!-- Feature tiles -->
        <div class="flex gap-2.5 w-full mb-6">
          <div
            class="flex-1 flex flex-col items-center text-center rounded-[10px] py-3 px-1.5"
            style="background: #f0f9ff; border: 1.5px solid #bae6fd"
          >
            <span class="text-lg mb-1">💳</span>
            <span
              class="font-bold leading-snug"
              style="font-size: 10px; color: #0369a1"
              >Tarjeta o saldo MP</span
            >
          </div>
          <div
            class="flex-1 flex flex-col items-center text-center rounded-[10px] py-3 px-1.5"
            style="background: #f0f9ff; border: 1.5px solid #bae6fd"
          >
            <span class="text-lg mb-1">🔒</span>
            <span
              class="font-bold leading-snug"
              style="font-size: 10px; color: #0369a1"
              >Pago 100% seguro</span
            >
          </div>
          <div
            class="flex-1 flex flex-col items-center text-center rounded-[10px] py-3 px-1.5"
            style="background: #f0f9ff; border: 1.5px solid #bae6fd"
          >
            <span class="text-lg mb-1">⚡</span>
            <span
              class="font-bold leading-snug"
              style="font-size: 10px; color: #0369a1"
              >Confirmación al instante</span
            >
          </div>
        </div>

        <!-- Open MP button -->
        <button
          class="w-full flex items-center justify-center gap-2.5 mb-3 transition-all active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-60"
          style="
            background: #009ee3;
            border: 2px solid #007ab8;
            border-radius: 12px;
            box-shadow: var(--shadow-mp);
            padding: 16px 20px;
          "
          :disabled="loading"
          @click="pay"
        >
          <span
            class="rounded-[5px] bg-white flex-shrink-0"
            style="
              padding: 3px 7px;
              font-family: &quot;Arial Black&quot;, sans-serif;
              font-size: 12px;
              font-weight: 900;
              color: #009ee3;
            "
            >MP</span
          >
          <span class="font-bold text-white" style="font-size: 16px">
            {{ loading ? "Redirigiendo..." : "Abrir Mercado Pago" }}
          </span>
          <span v-if="!loading" class="text-white/80" style="font-size: 18px"
            >↗</span
          >
        </button>

        <!-- Back to cart -->
        <button
          class="w-full font-bold text-gray-500 transition-colors active:border-black active:text-black"
          style="
            padding: 13px;
            border: 1.5px solid #e8e8e8;
            border-radius: 12px;
            background: #fff;
            font-size: 13px;
          "
          @click="step = 1"
        >
          ← Volver al carrito
        </button>
      </div>
    </template>

    <AppToast />
  </div>
</template>
