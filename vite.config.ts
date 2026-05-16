import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'WeSplit',
				short_name: 'WeSplit',
				description: 'Split expenses fairly with your group',
				theme_color: '#0a0a0a',
				background_color: '#0a0a0a',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'convex-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24
							},
							cacheableResponse: {
								statuses: [200]
							}
						}
					}
				]
			}
		})
	]
});
