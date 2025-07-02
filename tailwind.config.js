/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'grotesk': ['TBWAGrotesk', 'sans-serif'],
        'grotesk-regular': ['TBWAGrotesk-Regular', 'sans-serif'],
        'grotesk-medium': ['TBWAGrotesk-Medium', 'sans-serif'],
        'grotesk-semibold': ['TBWAGrotesk-SemiBold', 'sans-serif'],
        'grotesk-bold': ['TBWAGrotesk-Bold', 'sans-serif'],
        'grotesk-black': ['TBWAGrotesk-Black', 'sans-serif'],
      },
      colors: {
        tbwa: {
          yellow: '#FFFF00',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
} 