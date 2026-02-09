/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                urgent: {
                    DEFAULT: '#EF4444',
                    light: '#FEE2E2',
                    dark: '#DC2626'
                },
                deadline: {
                    DEFAULT: '#F59E0B',
                    light: '#FEF3C7',
                    dark: '#D97706'
                },
                admin: {
                    DEFAULT: '#3B82F6',
                    light: '#DBEAFE',
                    dark: '#2563EB'
                },
                creative: {
                    DEFAULT: '#8B5CF6',
                    light: '#EDE9FE',
                    dark: '#7C3AED'
                },
                surface: {
                    DEFAULT: '#1E1E2E',
                    light: '#2A2A3E',
                    dark: '#14141F'
                }
            },
            fontFamily: {
                sans: ['Noto Sans Thai', 'Inter', 'system-ui', 'sans-serif']
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'bounce-gentle': 'bounceGentle 2s infinite'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                bounceGentle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' }
                }
            }
        },
    },
    plugins: [],
}
