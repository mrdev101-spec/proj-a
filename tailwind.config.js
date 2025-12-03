/** @type {import('tailwindcss').Config} */

module.exports = {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                sarabun: ['Sarabun', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                }
            },
            animation: {
                'fade-in-up': 'fadeInUpBlur 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-up-card': 'slideUpCard 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
                'slide-in-down': 'slideInDown 0.5s ease-out forwards',
                'pulse-slow': 'pulse 3s infinite',
                'pop-in': 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                'spin-stop': 'spin-stop 2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
                'spin-reverse-stop': 'spin-reverse-stop 3s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
                'fade-slide-up': 'fade-slide-up 3s cubic-bezier(0.1, 0.8, 0.2, 1) forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInUpBlur: {
                    '0%': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
                },
                slideUpCard: {
                    '0%': { opacity: '0', transform: 'translateY(40px)', filter: 'blur(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.5)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'spin-stop': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(100deg)' },
                },
                'spin-reverse-stop': {
                    '0%': { transform: 'rotate(100deg)' },
                    '100%': { transform: 'rotate(0deg)' },
                },
                'fade-slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(50px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        }
    }
}
