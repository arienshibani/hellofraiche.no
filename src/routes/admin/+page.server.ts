import { redirect, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';

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

		const adminUser = env.ADMIN_DASHBOARD_USER;
		const adminPassword = env.ADMIN_DASHBOARD_PW;

		if (!adminUser || !adminPassword) {
			return fail(500, { error: 'Admin credentials not configured. Please set ADMIN_DASHBOARD_USER and ADMIN_DASHBOARD_PW in your .env file.' });
		}

		if (username === adminUser &&
			password === adminPassword) {
			cookies.set('admin_auth', 'true', { path: '/admin', httpOnly: true, sameSite: 'strict' });
			throw redirect(302, '/admin/dashboard');
		}

		return fail(401, { error: 'Ugyldig brukernavn eller passord' });
	}
};
