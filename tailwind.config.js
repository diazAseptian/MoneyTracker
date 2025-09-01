/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: [
    // Background colors for theme switching
    'bg-slate-50', 'bg-slate-400', 'dark:bg-slate-900',
    'bg-gray-50', 'bg-gray-400', 'dark:bg-gray-900',
    'bg-zinc-50', 'bg-zinc-400', 'dark:bg-zinc-900',
    'bg-neutral-50', 'bg-neutral-400', 'dark:bg-neutral-900',
    'bg-stone-50', 'bg-stone-400', 'dark:bg-stone-900',
    'bg-red-50', 'bg-red-400', 'dark:bg-red-900',
    'bg-orange-50', 'bg-orange-400', 'dark:bg-orange-900',
    'bg-amber-50', 'bg-amber-400', 'dark:bg-amber-900',
    'bg-yellow-50', 'bg-yellow-400', 'dark:bg-yellow-900',
    'bg-lime-50', 'bg-lime-400', 'dark:bg-lime-900',
    'bg-green-50', 'bg-green-400', 'dark:bg-green-900',
    'bg-emerald-50', 'bg-emerald-400', 'dark:bg-emerald-900',
    'bg-teal-50', 'bg-teal-400', 'dark:bg-teal-900',
    'bg-cyan-50', 'bg-cyan-400', 'dark:bg-cyan-900',
    'bg-sky-50', 'bg-sky-400', 'dark:bg-sky-900',
    'bg-blue-50', 'bg-blue-400', 'dark:bg-blue-900',
    'bg-indigo-50', 'bg-indigo-400', 'dark:bg-indigo-900',
    'bg-violet-50', 'bg-violet-400', 'dark:bg-violet-900',
    'bg-purple-50', 'bg-purple-400', 'dark:bg-purple-900',
    'bg-fuchsia-50', 'bg-fuchsia-400', 'dark:bg-fuchsia-900',
    'bg-pink-50', 'bg-pink-400', 'dark:bg-pink-900',
    'bg-rose-50', 'bg-rose-400', 'dark:bg-rose-900'
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
}