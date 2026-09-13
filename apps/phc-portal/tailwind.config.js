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
        // Medical Teal — primary identity
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Deep navy — dark mode surfaces
        navy: {
          900: '#0a0f1a',
          800: '#0d1523',
          700: '#111827',
          600: '#1a2537',
          500: '#1e2d3d',
          400: '#253347',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        // Subtle grid for dark mode bg
        'grid-dark': "linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px)",
        // Gradient glow for sidebar
        'sidebar-gradient': 'linear-gradient(180deg, #0a0f1a 0%, #0d1523 100%)',
        // Card glass effect
        'glass-light': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
        'glass-dark':  'linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(13,21,35,0.95) 100%)',
        // Primary shimmer
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(13,148,136,0.12) 50%, transparent 100%)',
      },
      boxShadow: {
        'card-light': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
        'card-dark':  '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.4)',
        'glow-teal':  '0 0 20px rgba(13,148,136,0.25), 0 0 40px rgba(13,148,136,0.10)',
        'glow-rose':  '0 0 20px rgba(225,29,72,0.35), 0 0 40px rgba(225,29,72,0.15)',
        'inner-top':  'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        // Pulse ring for emergency
        'pulse-ring':        'pulseRing 1.8s ease-out infinite',
        // Shimmer loading effect
        'shimmer-slide':     'shimmerSlide 2.2s ease-in-out infinite',
        // Soft float for cards
        'float':             'float 6s ease-in-out infinite',
        // Breathing glow
        'glow-pulse':        'glowPulse 2.5s ease-in-out infinite',
        // Stagger-in for lists
        'stagger-in':        'staggerIn 0.45s cubic-bezier(0.16,1,0.3,1) both',
        // Slide-up page
        'slide-up-fade':     'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1) both',
        // Scale-in for modals
        'scale-spring':      'scaleSpring 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        // Number ticker
        'count-bounce':      'countBounce 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        // Horizontal scan line (medical EKG feel)
        'scan-line':         'scanLine 3s linear infinite',
        // Dot blink for "live" indicator
        'live-blink':        'liveBlink 1.4s ease-in-out infinite',
        // Sweep right for progress bars
        'sweep-right':       'sweepRight 1s cubic-bezier(0.16,1,0.3,1) both',
        // Tab switch slide
        'slide-in-right':    'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        pulseRing: {
          '0%':   { boxShadow: '0 0 0 0 rgba(225,29,72,0.6)' },
          '70%':  { boxShadow: '0 0 0 10px rgba(225,29,72,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(225,29,72,0)' },
        },
        shimmerSlide: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 0 rgba(13,148,136,0)' },
          '50%':     { boxShadow: '0 0 20px rgba(13,148,136,0.3)' },
        },
        staggerIn: {
          '0%':   { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUpFade: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleSpring: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        countBounce: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scanLine: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        liveBlink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.3' },
        },
        sweepRight: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--target-width, 100%)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34,1.56,0.64,1)',
        smooth: 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
