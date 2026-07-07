/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/styles/**/*.css',
  ],
  safelist: [
    'cb-page',
    'cb-container',
    'cb-card',
    'cb-card-padded',
    'cb-btn-primary',
    'cb-btn-secondary',
    'cb-btn-ghost',
    'cb-portal-shell',
    'cb-nav-item',
    'cb-nav-item-active',
    'cb-nav-item-inactive',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
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
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        brand: {
          DEFAULT: 'hsl(var(--cb-brand))',
          hover: 'hsl(var(--cb-brand-hover))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        'accent-brand': {
          DEFAULT: 'hsl(var(--cb-accent))',
        },
        success: {
          DEFAULT: 'hsl(var(--cb-success))',
        },
        warning: {
          DEFAULT: 'hsl(var(--cb-warning))',
        },
        info: {
          DEFAULT: 'hsl(var(--cb-info))',
        },
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: '1.2', fontWeight: '600' }],
        title: ['var(--text-title)', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['var(--text-body)', { lineHeight: '1.5' }],
        caption: ['var(--text-caption)', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}
