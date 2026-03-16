<script setup lang="ts">
type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "big" | "medium" | "small";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    fullWidth?: boolean;
    size?: Size;
  }>(),
  {
    variant: "primary",
    loading: false,
    disabled: false,
    type: "button",
    fullWidth: false,
    size: "big",
  },
);

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-red text-white border-red-dark shadow-md-red active:box-shadow:shadow-xs-red",
  secondary: "bg-white text-black border-black shadow-md active:shadow-xs",
  danger: "bg-red text-white border-black shadow-md active:shadow-xs",
  ghost:
    "bg-transparent text-red border-dashed border-red shadow-none active:bg-red-light",
};

const sizeClasses: Record<Size, string> = {
  big: "px-8 py-4 border-[1.5px]",
  medium: "px-6 py-3 border-[1.5px]",
  small: "px-4 py-2 border-[1px]",
};
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md font-bold text-base align-middle leading-none cursor-pointer transition-[transform,box-shadow] duration-100',
      'active:translate-x-[3px] active:translate-y-[3px]',
      'disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:[box-shadow:none] disabled:cursor-not-allowed disabled:pointer-events-none',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
