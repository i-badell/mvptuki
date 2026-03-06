<script setup lang="ts">
const { register, login } = useAuth()
const toast = useToast()

const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  errors.value = {}
  if (!fullName.value.trim()) errors.value.fullName = 'Full name is required'
  if (!email.value.includes('@')) errors.value.email = 'Enter a valid email address'
  if (password.value.length < 8)
    errors.value.password = 'Password must be at least 8 characters'
  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validate()) return

  loading.value = true

  const result = await register(email.value, password.value, fullName.value)

  if (!result.success) {
    toast.error(result.error ?? 'Registration failed. Please try again.')
    loading.value = false
    return
  }

  // Auto-login after registration
  await login(email.value, password.value)
  loading.value = false
  navigateTo('/festival')
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <h2 class="text-2xl font-bold text-text-primary">Create account</h2>

    <AppInput
      v-model="fullName"
      label="Full name"
      type="text"
      placeholder="Ana García"
      autocomplete="name"
      required
      :error="errors.fullName"
    />
    <AppInput
      v-model="email"
      label="Email"
      type="email"
      placeholder="you@example.com"
      autocomplete="email"
      required
      :error="errors.email"
    />
    <AppInput
      v-model="password"
      label="Password"
      type="password"
      placeholder="At least 8 characters"
      autocomplete="new-password"
      required
      :error="errors.password"
    />

    <AppButton type="submit" :loading="loading" full-width>Create account</AppButton>

    <p class="text-center text-sm text-text-muted">
      Already have an account?
      <NuxtLink to="/login" class="text-brand-primary hover:underline">Sign in</NuxtLink>
    </p>
  </form>
</template>
