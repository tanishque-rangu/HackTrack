/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        card: 'var(--card)',
        cardForeground: 'var(--card-fg)',
        panel: 'var(--panel-bg)',
        panelAlt: 'var(--panel-alt-bg)',
        overlay: 'var(--black-overlay)',
        borderSubtle: 'var(--border-white-5)',
        borderMuted: 'var(--border-white-10)',
        primary: 'var(--primary)',
        primaryLight: 'var(--primary-light)',
        primaryForeground: 'var(--primary-fg)',
        accent: 'var(--accent)',
        accentForeground: 'var(--accent-fg)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        darkblue: 'var(--darkblue)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ki-float': 'kiFloat 3s ease-in-out infinite',
      },
      keyframes: {
        kiFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      backgroundImage: {
        'ki-gradient': 'radial-gradient(circle at top, rgba(245, 124, 0, 0.15) 0%, transparent 60%)',
        'ki-orange-gradient': 'radial-gradient(circle at center, rgba(245, 124, 0, 0.2) 0%, transparent 70%)',
        'ki-blue-gradient': 'radial-gradient(circle at bottom, rgba(30, 136, 229, 0.1) 0%, transparent 60%)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      }
    },
  },
  plugins: [],
}
