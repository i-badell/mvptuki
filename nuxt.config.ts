import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  modules: ["@nuxtjs/supabase", "@nuxt/image", "@nuxt/fonts"],

  components: [{ path: "~/components", pathPrefix: false }],

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/register", "/forgot-password", "/reset-password"],
    },
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["gasoline-otherwise-legends-condos.trycloudflare.com"],
    },
  },

  image: {
    // @nuxt/image: optimize remote images (Supabase Storage + picsum)
    domains: ["picsum.photos"],
  },

  fonts: {
    // @nuxt/fonts: defaults to Google Fonts provider; configure per-font in CSS
    defaults: {
      weights: [400, 500, 600, 700],
    },
  },

  runtimeConfig: {
    // Server-only (never sent to client)
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    mpAccessToken: process.env.MP_ACCESS_TOKEN,
    mpWebhookSecret: process.env.MP_WEBHOOK_SECRET,
    // Public (exposed to client)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    },
  },

  devtools: { enabled: true },
});
