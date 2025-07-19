import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        body: ['Poppins', 'Roboto', 'sans-serif'],
        headline: ['Poppins', 'Roboto', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'clap-top': {
            '0%, 40%': { transform: 'translateY(-15%) rotate(-15deg)' },
            '70%': { transform: 'translateY(0) rotate(0deg)' },
            '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        'clap-bottom': {
            '0%, 40%': { transform: 'translateY(5%)' },
            '70%': { transform: 'translateY(0)' },
            '100%': { transform: 'translateY(0)' },
        },
        'light-flash': {
            '0%, 70%': { transform: 'scale(0)', opacity: '0' },
            '80%': { transform: 'scale(250)', opacity: '0.8' },
            '100%': { transform: 'scale(350)', opacity: '0' }
        },
        'text-appear': {
            '0%, 80%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'board-text-appear': {
          '0%, 50%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'clap-top': 'clap-top 1.2s cubic-bezier(0.6, 0, 0.4, 1) forwards',
        'clap-bottom': 'clap-bottom 1.2s cubic-bezier(0.6, 0, 0.4, 1) forwards',
        'light-flash': 'light-flash 1s ease-out forwards 0.7s',
        'text-appear': 'text-appear 1s ease-out forwards 0.8s',
        'board-text-appear': 'board-text-appear 1.5s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
