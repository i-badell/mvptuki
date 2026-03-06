<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { sendPasswordReset } = useAuth()
const toast = useToast()

const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function submit() {
  loading.value = true
  const result = await sendPasswordReset(email.value)
  loading.value = false

  if (!result.success) {
    toast.error(result.error ?? 'Could not send reset email. Please try again.')
    return
  }

  sent.value = true
}
</script>

<template>
  <div>
    <div v-if="!sent" class="flex flex-col gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Reset your password</h2>
        <p class="text-sm text-text-muted mt-1">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />
        <AppButton type="submit" :loading="loading" full-width>Send reset link</AppButton>
      </form>

      <p class="text-center text-sm text-text-muted">
        <NuxtLink to="/login" class="text-brand-primary hover:underline">Back to login</NuxtLink>
      </p>
    </div>

    <!-- Confirmation state -->
    <div v-else class="text-center flex flex-col gap-4">
      <div class="text-5xl">📬</div>
      <h2 class="text-xl font-bold text-text-primary">Check your inbox</h2>
      <p class="text-sm text-text-muted">
        We sent a password reset link to <strong>{{ email }}</strong>. Check your spam folder if
        it doesn't arrive within a few minutes.
      </p>
      <NuxtLink to="/login" class="text-brand-primary hover:underline text-sm">
        Back to login
      </NuxtLink>
    </div>

    <AppToast />
  </div>
</template>
