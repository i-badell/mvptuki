<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { updatePassword } = useAuth()
const toast = useToast()

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  const result = await updatePassword(password.value)
  loading.value = false

  if (!result.success) {
    toast.error(result.error ?? 'Failed to update password. Try requesting a new link.')
    return
  }

  toast.success('Password updated! Please log in with your new password.')
  setTimeout(() => navigateTo('/login'), 2000)
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <div>
      <h2 class="text-2xl font-bold text-text-primary">Set new password</h2>
      <p class="text-sm text-text-muted mt-1">Choose a password with at least 8 characters.</p>
    </div>

    <AppInput
      v-model="password"
      label="New password"
      type="password"
      placeholder="At least 8 characters"
      autocomplete="new-password"
      required
    />
    <AppInput
      v-model="confirm"
      label="Confirm password"
      type="password"
      placeholder="Repeat your new password"
      autocomplete="new-password"
      required
    />

    <p v-if="error" class="text-sm text-error">{{ error }}</p>

    <AppButton type="submit" :loading="loading" full-width>Update password</AppButton>
  </form>
  <AppToast />
</template>
