<script setup lang="ts">
const { login } = useAuth()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
// Generic error — does not reveal which field is wrong (FR-003)
const authError = ref('')

async function submit() {
  authError.value = ''
  loading.value = true

  const result = await login(email.value, password.value)

  loading.value = false

  if (!result.success) {
    // FR-003: non-field-specific error
    authError.value = 'Incorrect email or password. Please try again.'
    return
  }

  navigateTo('/festival')
}
</script>

<template>
  <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <h2 class="text-2xl font-bold text-text-primary">Welcome back</h2>

    <AppInput
      v-model="email"
      label="Email"
      type="email"
      placeholder="you@example.com"
      autocomplete="email"
      required
    />
    <AppInput
      v-model="password"
      label="Password"
      type="password"
      placeholder="••••••••"
      autocomplete="current-password"
      required
    />

    <p v-if="authError" class="text-sm text-error text-center">{{ authError }}</p>

    <AppButton type="submit" :loading="loading" full-width>Sign in</AppButton>

    <p class="text-center text-sm text-text-muted">
      <NuxtLink to="/forgot-password" class="text-brand-primary hover:underline">
        Forgot your password?
      </NuxtLink>
    </p>

    <p class="text-center text-sm text-text-muted">
      Don't have an account?
      <NuxtLink to="/register" class="text-brand-primary hover:underline">Sign up</NuxtLink>
    </p>
  </form>
</template>
