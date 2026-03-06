<script setup lang="ts">
definePageMeta({ layout: 'vendor', middleware: 'vendor-only' })

import type { VendorStatus } from '~~/shared/types'

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const vendorId = ref<string | null>(null)
const vendorStatus = ref<VendorStatus>('active')
const profileLoading = ref(true)

onMounted(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('vendor_id')
    .eq('id', user.value!.id)
    .single()

  vendorId.value = data?.vendor_id ?? null

  if (vendorId.value) {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('status')
      .eq('id', vendorId.value)
      .single()
    vendorStatus.value = (vendor?.status as VendorStatus) ?? 'active'
  }

  profileLoading.value = false
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-bold text-text-primary">Order Queue</h1>

    <template v-if="profileLoading">
      <div class="h-16 rounded-card bg-surface-muted animate-pulse" />
      <div class="h-32 rounded-card bg-surface-muted animate-pulse" />
    </template>

    <template v-else-if="vendorId">
      <PauseToggle
        :vendor-id="vendorId"
        :status="vendorStatus"
        @update:status="vendorStatus = $event"
      />

      <OrderQueue :vendor-id="vendorId" :orders="[]" />
    </template>

    <div v-else class="text-center py-12 text-text-muted text-sm">
      Vendor profile not configured. Contact your administrator.
    </div>
  </div>
  <AppToast />
</template>
