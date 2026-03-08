<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const user = useSupabaseUser()
const { logout } = useAuth()
const supabase = useSupabaseClient()
const toast = useToast()

// ── Editable profile state ────────────────────────────────────────────────
const editing = ref(false)
const fullName = ref('')
const email = ref('')

const displayName = computed(() => user.value?.user_metadata?.full_name ?? user.value?.email ?? '')
const displayEmail = computed(() => user.value?.email ?? '')
const initials = computed(() => {
  const name = displayName.value
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

function startEdit() {
  fullName.value = displayName.value
  email.value = displayEmail.value
  editing.value = true
}

async function saveEdit() {
  const { error } = await supabase.auth.updateUser({
    email: email.value !== displayEmail.value ? email.value : undefined,
    data: { full_name: fullName.value },
  })
  if (error) {
    toast.error(error.message)
  } else {
    toast.success('Cambios guardados')
    editing.value = false
  }
}

// ── Notification toggle ───────────────────────────────────────────────────
const notificationsOn = ref(true)

function toggleNotifications() {
  notificationsOn.value = !notificationsOn.value
  toast.info(notificationsOn.value ? 'Notificaciones activadas' : 'Notificaciones desactivadas')
}
</script>

<template>
  <div class="min-h-screen font-sans" style="background: #f8f8f8; padding-bottom: 24px;">

    <!-- ── HEADER ──────────────────────────────────────────────────────────── -->
    <header
      class="bg-white flex items-center justify-between px-5"
      style="border-bottom: 2px solid #111111; padding-top: 13px; padding-bottom: 13px;"
    >
      <div>
        <div class="font-display text-black" style="font-size: 26px; letter-spacing: 3px; line-height: 1;">Mi Perfil</div>
        <div class="text-gray-500 uppercase" style="font-size: 10px; letter-spacing: 1.2px; margin-top: 1px;">Festival activo</div>
      </div>
      <button
        class="flex items-center gap-1.5 font-bold transition-colors active:bg-gray-100"
        :class="editing ? 'bg-black text-white' : 'bg-white text-black'"
        style="height: 34px; padding: 0 14px; border-radius: 8px; border: 1.5px solid #111111; font-size: 12px;"
        @click="editing ? saveEdit() : startEdit()"
      >
        <!-- Edit icon -->
        <svg v-if="!editing" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        <!-- Save icon -->
        <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ editing ? 'Guardar' : 'Editar' }}
      </button>
    </header>

    <!-- ── AVATAR + INFO ───────────────────────────────────────────────────── -->
    <div
      class="bg-white flex items-center gap-4 px-5"
      style="padding-top: 24px; padding-bottom: 20px; border-bottom: 1.5px solid #e8e8e8;"
    >
      <!-- Avatar -->
      <div class="relative flex-shrink-0">
        <div
          class="flex items-center justify-center rounded-full"
          style="width: 72px; height: 72px; background: #d42b2b; border: 3px solid #111111; box-shadow: 3px 3px 0 #111111;"
        >
          <span class="font-display text-white" style="font-size: 28px; letter-spacing: 1px;">{{ initials }}</span>
        </div>
        <div
          v-if="editing"
          class="absolute flex items-center justify-center rounded-full bg-black"
          style="bottom: -2px; right: -2px; width: 24px; height: 24px; border: 2px solid white; font-size: 11px; cursor: pointer;"
        >
          📷
        </div>
      </div>

      <!-- Info (view mode) -->
      <div v-if="!editing" class="flex-1 min-w-0">
        <div class="font-serif font-bold text-black" style="font-size: 20px; line-height: 1.1; margin-bottom: 4px;">
          {{ displayName }}
        </div>
        <div class="text-gray-500 truncate" style="font-size: 12px; margin-bottom: 6px;">
          {{ displayEmail }}
        </div>
        <div
          class="inline-flex items-center gap-1.5 text-gray-700 font-bold uppercase"
          style="background: #f8f8f8; border: 1.5px solid #e8e8e8; border-radius: 6px; padding: 3px 9px; font-size: 10px; letter-spacing: 0.5px;"
        >
          <span class="rounded-full bg-success flex-shrink-0" style="width: 5px; height: 5px;" />
          Miembro activo
        </div>
      </div>

      <!-- Edit form (edit mode) -->
      <div v-else class="flex-1 min-w-0 space-y-3">
        <div>
          <div class="font-bold text-gray-500 uppercase mb-1" style="font-size: 10px; letter-spacing: 1px;">Nombre</div>
          <input
            v-model="fullName"
            type="text"
            class="w-full text-black outline-none transition-colors"
            style="background: #f8f8f8; border: 1.5px solid #e8e8e8; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit;"
            @focus="($event.target as HTMLInputElement).style.borderColor = '#111111'"
            @blur="($event.target as HTMLInputElement).style.borderColor = '#e8e8e8'"
          >
        </div>
        <div>
          <div class="font-bold text-gray-500 uppercase mb-1" style="font-size: 10px; letter-spacing: 1px;">Email</div>
          <input
            v-model="email"
            type="email"
            class="w-full text-black outline-none transition-colors"
            style="background: #f8f8f8; border: 1.5px solid #e8e8e8; border-radius: 8px; padding: 10px 12px; font-size: 14px; font-family: inherit;"
            @focus="($event.target as HTMLInputElement).style.borderColor = '#111111'"
            @blur="($event.target as HTMLInputElement).style.borderColor = '#e8e8e8'"
          >
        </div>
      </div>
    </div>

    <!-- ── MÉTODO DE PAGO ──────────────────────────────────────────────────── -->
    <div
      class="mx-5 bg-white overflow-hidden"
      style="margin-top: 16px; border: 1.5px solid #111111; border-radius: 14px; box-shadow: 4px 4px 0 #111111;"
    >
      <div
        class="font-display text-gray-500 uppercase"
        style="font-size: 14px; letter-spacing: 2px; padding: 12px 16px 8px; border-bottom: 1.5px solid #e8e8e8;"
      >
        Método de pago
      </div>

      <!-- Mercado Pago row -->
      <div class="flex items-center gap-3 px-4" style="padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0f0f0;">
        <div
          class="flex items-center justify-center flex-shrink-0 rounded-[10px]"
          style="width: 44px; height: 44px; background: #009ee3;"
        >
          <span style="font-family: 'Arial Black', sans-serif; font-size: 13px; font-weight: 900; color: white; letter-spacing: -0.5px;">MP</span>
        </div>
        <div class="flex-1">
          <div class="font-bold text-black" style="font-size: 14px; margin-bottom: 2px;">Mercado Pago</div>
          <div class="text-gray-500" style="font-size: 11px;">{{ displayEmail }} · Cuenta vinculada</div>
        </div>
        <div
          class="font-bold uppercase flex-shrink-0 rounded"
          style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-size: 9px; padding: 2px 7px; letter-spacing: 0.5px;"
        >
          Activo
        </div>
      </div>

      <!-- Add method row -->
      <button
        class="w-full flex items-center gap-2.5 px-4 transition-colors active:bg-gray-50"
        style="padding-top: 12px; padding-bottom: 12px;"
        @click="toast.info('Próximamente: agregar método de pago')"
      >
        <div
          class="flex items-center justify-center flex-shrink-0 rounded-lg text-red"
          style="width: 36px; height: 36px; border: 1.5px dashed #d42b2b; font-size: 18px;"
        >
          +
        </div>
        <span class="font-bold text-red" style="font-size: 13px;">Agregar método de pago</span>
      </button>
    </div>

    <!-- ── CONFIGURACIÓN ───────────────────────────────────────────────────── -->
    <div
      class="mx-5 bg-white overflow-hidden"
      style="margin-top: 16px; border: 1.5px solid #111111; border-radius: 14px; box-shadow: 4px 4px 0 #111111;"
    >
      <div
        class="font-display text-gray-500 uppercase"
        style="font-size: 14px; letter-spacing: 2px; padding: 12px 16px 8px; border-bottom: 1.5px solid #e8e8e8;"
      >
        Configuración
      </div>

      <!-- Notificaciones -->
      <div class="flex items-center gap-3 px-4" style="padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0f0f0;">
        <div class="flex items-center justify-center flex-shrink-0 rounded-[9px]" style="width: 36px; height: 36px; background: #fef3c7; font-size: 17px;">🔔</div>
        <div class="flex-1">
          <div class="font-semibold text-black" style="font-size: 14px;">Notificaciones</div>
          <div class="text-gray-500" style="font-size: 11px; margin-top: 1px;">Pedidos listos, novedades</div>
        </div>
        <!-- Toggle -->
        <button
          class="relative flex-shrink-0 transition-colors"
          :class="notificationsOn ? 'bg-black' : 'bg-gray-200'"
          style="width: 40px; height: 22px; border-radius: 11px; border: 1.5px solid; transition: background 0.2s;"
          :style="{ borderColor: notificationsOn ? '#111111' : '#dddddd' }"
          @click="toggleNotifications"
        >
          <span
            class="absolute top-[2px] left-[2px] bg-white rounded-full transition-transform"
            style="width: 16px; height: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"
            :style="{ transform: notificationsOn ? 'translateX(18px)' : 'translateX(0)' }"
          />
        </button>
      </div>

      <!-- Privacidad -->
      <button
        class="w-full flex items-center gap-3 px-4 transition-colors active:bg-gray-50"
        style="padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0f0f0;"
        @click="toast.info('Próximamente: privacidad')"
      >
        <div class="flex items-center justify-center flex-shrink-0 rounded-[9px]" style="width: 36px; height: 36px; background: #f0f9ff; font-size: 17px;">🔒</div>
        <div class="flex-1 text-left">
          <div class="font-semibold text-black" style="font-size: 14px;">Privacidad</div>
          <div class="text-gray-500" style="font-size: 11px; margin-top: 1px;">Datos y permisos</div>
        </div>
        <span class="text-gray-300 flex-shrink-0" style="font-size: 14px;">›</span>
      </button>

      <!-- Idioma -->
      <button
        class="w-full flex items-center gap-3 px-4 transition-colors active:bg-gray-50"
        style="padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0f0f0;"
        @click="toast.info('Próximamente: idioma')"
      >
        <div class="flex items-center justify-center flex-shrink-0 rounded-[9px]" style="width: 36px; height: 36px; background: #f5f3ff; font-size: 17px;">🌐</div>
        <div class="flex-1 text-left">
          <div class="font-semibold text-black" style="font-size: 14px;">Idioma</div>
          <div class="text-gray-500" style="font-size: 11px; margin-top: 1px;">Español</div>
        </div>
        <span class="text-gray-300 flex-shrink-0" style="font-size: 14px;">›</span>
      </button>

      <!-- Ayuda -->
      <button
        class="w-full flex items-center gap-3 px-4 transition-colors active:bg-gray-50"
        style="padding-top: 14px; padding-bottom: 14px; border-bottom: 1px solid #f0f0f0;"
        @click="toast.info('Próximamente: ayuda')"
      >
        <div class="flex items-center justify-center flex-shrink-0 rounded-[9px]" style="width: 36px; height: 36px; background: #f0fdf4; font-size: 17px;">💬</div>
        <div class="flex-1 text-left">
          <div class="font-semibold text-black" style="font-size: 14px;">Ayuda y soporte</div>
          <div class="text-gray-500" style="font-size: 11px; margin-top: 1px;">Preguntas frecuentes, contacto</div>
        </div>
        <span class="text-gray-300 flex-shrink-0" style="font-size: 14px;">›</span>
      </button>

      <!-- Cerrar sesión -->
      <button
        class="w-full flex items-center gap-3 px-4 transition-colors active:bg-gray-50"
        style="padding-top: 14px; padding-bottom: 14px;"
        @click="logout"
      >
        <div class="flex items-center justify-center flex-shrink-0 rounded-[9px]" style="width: 36px; height: 36px; background: #fee2e2; font-size: 17px;">🚪</div>
        <div class="flex-1 text-left">
          <div class="font-semibold text-red" style="font-size: 14px;">Cerrar sesión</div>
        </div>
        <span class="flex-shrink-0" style="font-size: 14px; color: #d42b2b;">›</span>
      </button>
    </div>

    <!-- ── VERSION ─────────────────────────────────────────────────────────── -->
    <div class="text-center text-gray-300 mt-4 mb-2" style="font-size: 11px;">
      Tuki v0.1.0 · Festival activo
    </div>

  </div>
</template>
