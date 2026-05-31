/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E87722',
        background: '#0A0A0A',
        defaultText: '#E0E0E0',
        evHighLight: '#F5C842',
        sidedrawer: '#1A1A2E',
        hold: '#E87722',
        held: '#F5C842',
      },
    },
  },
  plugins: [],
}
