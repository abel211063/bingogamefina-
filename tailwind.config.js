/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'Arial', 'Helvetica', 'sans-serif'], // Poppins is imported, Arial/Helvetica as fallbacks
      },
      colors: {
        // Keep these custom colors defined here so you can still use them directly if needed,
        // but for DaisyUI theming, they will be mapped below.
        'dama-red-dark': '#772004',
        'dama-red-mid': '#981E02',
        'dama-red-light': '#620202',
        'dama-orange': '#FFAE11',
        'dama-blue': '#2185CE',
        'dama-green': '#52AF51',
        'dama-purple': '#4B0082',
        'dama-dark-gray': '#3F3F3F',
        'dama-light-gray': '#EDEEEE',
        'dama-text-dark': '#33484F',
        'dama-text-light': '#FFFFFF',
        'dama-success': '#05F137', // from .text-[#05F137]
        'dama-error': '#FD3737', // from .text-[#FD3737]
      },
      keyframes: {
        'scale-down-center': {
          '0%, 40%': { transform: 'scale(1.5)' },
          '20%': { transform: 'scale(1.25)' },
          '60%': { transform: 'scale(1)' },
          '80%': { transform: 'scale(1.1)' },
          'to': { transform: 'scale(1)' },
        },
      },
      animation: {
        'scale-down-center': 'scale-down-center 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'scale-down-center-2': 'scale-down-center 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s both', // with delay
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave", "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua", "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula", "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee", "winter", "dim", "nord", "sunset",
      // Define your custom "red" theme here
      {
        "red": { // This is the theme name you will select in settings
          // Base colors
          "base-100": "#772004", // Your 'dama-red-dark' for main backgrounds
          "base-200": "#981E02", // Your 'dama-red-mid' for slightly lighter/secondary backgrounds (like drawers)
          "base-300": "#620202", // Your 'dama-red-light' for tertiary backgrounds
          "base-content": "#FFFFFF", // Your 'dama-text-light' for text on base colors

          // Primary brand colors (e.g., for buttons, active states)
          "primary": "#FFAE11", // Your 'dama-orange'
          "primary-focus": "#E69A00", // Slightly darker orange for focus/hover
          "primary-content": "#33484F", // Your 'dama-text-dark' for text on primary

          // Secondary brand colors (alternative accents)
          "secondary": "#2185CE", // Your 'dama-blue'
          "secondary-focus": "#1A6AB0", // Slightly darker blue
          "secondary-content": "#FFFFFF", // White text on secondary

          // Accent colors
          "accent": "#4B0082", // Your 'dama-purple'
          "accent-focus": "#380066", // Slightly darker purple
          "accent-content": "#FFFFFF", // White text on accent

          // Neutral colors
          "neutral": "#3F3F3F", // Your 'dama-dark-gray'
          "neutral-focus": "#2E2E2E", // Slightly darker gray
          "neutral-content": "#FFFFFF", // White text on neutral

          // Status colors
          "info": "#3ABFF8",
          "success": "#05F137", // Your 'dama-success'
          "warning": "#FBBD23",
          "error": "#FD3737", // Your 'dama-error'

          "--rounded-box": "1rem", // Border radius for cards, etc.
          "--rounded-btn": "0.5rem", // Border radius for buttons
          "--rounded-badge": "1.9rem", // Border radius for badges
          "--animation-btn": "0.25s", // Duration of button animation
          "--animation-input": "0.2s", // Duration of input animation
          "--btn-focus-scale": "0.95", // Scale effect for buttons on focus
          "--border-btn": "1px", // Border width for buttons
          "--tab-border": "1px", // Border width for tabs
          "--tab-radius": "0.5rem", // Border radius for tabs
        },
      },
    ],
    // You might want to unset default DaisyUI component colors if your gradients conflict.
    // base: true, // applies background color and foreground color for root element
    // styled: true, // applies daisyUI colors to all components
    // utils: true, // adds responsive utility classes
    // logs: true, // Shows info about daisyUI in console
    // prefix: "", // prefix for daisyUI classnames (e.g. "du-btn")
    // darkTheme: "dark", // name of one of the daisyUI themes that is used as a default for @media (prefers-color-scheme: dark)
  },
}