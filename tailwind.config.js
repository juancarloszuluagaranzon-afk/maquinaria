/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                glass: {
                    100: 'rgba(255, 255, 255, 0.1)',
                    200: 'rgba(255, 255, 255, 0.2)',
                    300: 'rgba(255, 255, 255, 0.3)',
                    dark: 'rgba(0, 0, 0, 0.3)',
                },
                primary: {
                    DEFAULT: '#3b82f6', // Blue 500
                    dark: '#1d4ed8',    // Blue 700
                },
                accent: {
                    DEFAULT: '#06b6d4', // Cyan 500
                }
            },
            backdropBlur: {
                xs: '2px',
            },
            backgroundImage: {
                'liquid-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
            }
        },
    },
    plugins: [],
}
