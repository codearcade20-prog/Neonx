/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    { pattern: /(bg|text|border|shadow)-(neon-blue|neon-gold|neon-purple|neon-green|neon-pink)/ }
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0f172a', // Slate 900
        'card-bg': '#1e293b', // Slate 800
        'neon-blue': '#3b82f6',
        'neon-gold': '#f59e0b',
        'neon-purple': '#a855f7',
        'neon-green': '#22c55e',
        'neon-pink': '#ec4899',
      },
      boxShadow: {
        'glow-blue': '0 0 15px 2px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-gold': '0 0 15px 2px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-purple': '0 0 15px 2px rgba(168, 85, 247, 0.6), inset 0 0 20px rgba(168, 85, 247, 0.4)',
        'glow-green': '0 0 15px 2px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(34, 197, 94, 0.4)',
        'glow-pink': '0 0 15px 2px rgba(236, 72, 153, 0.6), inset 0 0 20px rgba(236, 72, 153, 0.4)',
      },
      dropShadow: {
        'glow': '0 0 10px rgba(255, 255, 255, 0.8)',
      }
    },
  },
  plugins: [],
}
