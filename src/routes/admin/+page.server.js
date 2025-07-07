import { redirect, fail } from '@sveltejs/kit';
import { ADMIN_DASHBOARD_USER, ADMIN_DASHBOARD_PW } from '$env/static/private';

export const load = async ({ cookies }) => {
    // If already logged in, redirect to dashboard
    if (cookies.get('admin_auth') === 'true') {
        throw redirect(302, '/admin/dashboard');
    }
    return {};
};

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        if (username === ADMIN_DASHBOARD_USER && password === ADMIN_DASHBOARD_PW) {
            cookies.set('admin_auth', 'true', { path: '/admin', httpOnly: true, sameSite: 'strict' });
            throw redirect(302, '/admin/dashboard');
        } else {
            return fail(401, { error: 'Ugyldig brukernavn eller passord' });
        }
    }
};
