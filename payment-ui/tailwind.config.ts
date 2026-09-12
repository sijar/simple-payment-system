import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                },
                success: {
                    500: '#22c55e',
                    600: '#16a34a',
                },
                error: {
                    500: '#ef4444',
                    600: '#dc2626',
                },
            },
        },
    },
    plugins: [],
}
export default config
