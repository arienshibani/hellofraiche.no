import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';


/** @type {import('@sveltejs/kit').Config} */
const config = {
	
	kit: {
		adapter: adapter({
			runtime: 'nodejs24.x'
		}),
		alias: {
			$db: "./src/db"
		}
	},
	preprocess: vitePreprocess()
};

export default config;
