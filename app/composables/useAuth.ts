// Auth composable — wraps @nuxtjs/supabase for register, login, logout, and password reset.
export function useAuth() {
  const supabase = useSupabaseClient()
  const toast = useToast()

  async function register(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) return { success: false as const, error: error.message }
    return { success: true as const, data }
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false as const, error: error.message }
    return { success: true as const, data }
  }

  async function logout() {
    await supabase.auth.signOut()
    navigateTo('/login')
  }

  async function sendPasswordReset(email: string) {
    const config = useRuntimeConfig()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.public.appUrl}/reset-password`,
    })
    if (error) return { success: false as const, error: error.message }
    return { success: true as const }
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false as const, error: error.message }
    return { success: true as const }
  }

  return { register, login, logout, sendPasswordReset, updatePassword }
}
