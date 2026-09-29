/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: '0.5rem',
  			md: 'calc(0.5rem - 2px)',
  			sm: 'calc(0.5rem - 4px)',
  			card: '0.5rem',
  			modal: '0.75rem'
  		},
  		colors: {
  			onyx: '#131515',
  			graphite: '#2B2C28',
  			'graphite-hover': '#353630',
  			verdigris: {
  				DEFAULT: '#339989',
  				hover: '#2A7A6E',
  				light: 'rgba(51,153,137,0.10)'
  			},
  			pearl: {
  				DEFAULT: '#7DE2D1',
  				muted: 'rgba(125,226,209,0.20)'
  			},
  			snow: '#FFFAFB',
  			danger: '#E63946',
  			warning: '#F4A261',
  			success: '#7DE2D1',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))'
  		},
  		fontFamily: {
  			heading: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
  			'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
  			'slide-in-right': { from: { transform: 'translateX(100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
  			'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
  			'scale-in': { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slide-in-right': 'slide-in-right 0.3s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
