/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}", 
        "./src/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                mint: {
                50: '#e8f9f4',
                100: '#f2fdfa',
                200: '#c9ede1',
                300: '#a8ded0',
                400: '#cdf1e6',
                500: '#8fd9c4',
                600: '#e2f8f0',
                700: '#1a5c4a',
                800: '#1a8f6f',
                }
            }
        },
    },
    plugins: [],
};