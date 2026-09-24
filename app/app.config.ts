// Smaller corners on form fields than on buttons and cards
const fieldRadius = {
  defaultVariants: { size: 'lg' as const },
  variants: { size: { lg: { base: 'px-3.5 py-2.5 text-base/5 gap-2' } } },
  compoundVariants: [
    { variant: ['outline', 'soft', 'subtle', 'ghost', 'none'], class: { base: 'rounded-[0.5rem]' } }
  ]
}

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'neutral'
    },
    button: {
      defaultVariants: { size: 'lg' },
      // Roomier large size: 40px tall, same as the form fields
      variants: { size: { lg: { base: 'px-4 py-2.5 text-sm gap-2' } } },
      compoundVariants: [
        { size: 'lg', square: true, class: 'p-2.5' },
        // Dark mode: deep indigo with white text instead of pale lavender with black text
        { color: 'primary', variant: 'solid', class: 'dark:bg-(--ui-color-primary-600) dark:text-white dark:hover:bg-(--ui-color-primary-500) dark:disabled:bg-(--ui-color-primary-600) dark:aria-disabled:bg-(--ui-color-primary-600)' }
      ]
    },
    input: fieldRadius,
    textarea: fieldRadius,
    select: fieldRadius,
    selectMenu: fieldRadius,
    inputMenu: fieldRadius,
    inputNumber: { compoundVariants: fieldRadius.compoundVariants, defaultVariants: fieldRadius.defaultVariants }
  }
})
