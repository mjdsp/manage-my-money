import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        hmr: {
            host: '192.168.0.100', // your Ethernet IP
        },
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
});
