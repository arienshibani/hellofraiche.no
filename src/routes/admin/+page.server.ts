import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// Import environment variables - these may not exist in all environments
// Using a try-catch import pattern that works at module level
let ADMIN_DASHBOARD_USER: string | undefined;
let ADMIN_DASHBOARD_PW: string | undefined;

// Use a function to get env vars safely
async function getEnvVars() {
	try {
		const env = await import('$env/static/private');
		return {
			user: (env as any).ADMIN_DASHBOARD_USER as string | undefined,
			password: (env as any).ADMIN_DASHBOARD_PW as string | undefined
		};
	} catch {
		return { user: undefined, password: undefined };
	}
}

export const load: PageServerLoad = async ({ cookies }) => {
	// If already logged in, redirect to dashboard
	if (cookies.get('admin_auth') === 'true') {
		throw redirect(302, '/admin/dashboard');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		// Get form data
		const data = await request.formData();

		// Validate credentials
		const username = data.get('username');
		const password = data.get('password');

		// Check if credentials match
		if (!username || !password) {
			return fail(400, { error: 'Brukernavn og passord må fylles ut' });
		}

		const envVars = await getEnvVars();
		if (username === envVars.user &&
			password === envVars.password) {
			cookies.set('admin_auth', 'true', { path: '/admin', httpOnly: true, sameSite: 'strict' });
			throw redirect(302, '/admin/dashboard');
		}

		return fail(401, { error: 'Ugyldig brukernavn eller passord' });
	}
};
