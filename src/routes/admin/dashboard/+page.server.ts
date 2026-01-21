import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';
import { redirect } from '@sveltejs/kit';
import type { Recipe, IngredientWithPrice } from '$lib/types';
import type { PageServerLoad } from './$types';

export type AdminDashboardPageData = {
	recipes: Recipe[];
	ingredients: IngredientWithPrice[];
};

export const load: PageServerLoad = async ({ cookies }): Promise<AdminDashboardPageData> => {
	if (cookies.get('admin_auth') !== 'true') {
		throw redirect(302, '/admin');
	}
	const db = await getDatabase();
	const recipes = await db.collection('recipes').find({}).sort({ _id: -1 }).toArray() as unknown as Recipe[];
	const ingredients = await db.collection('ingredients').find({}).toArray() as unknown as IngredientWithPrice[];

	return {
		recipes: serializeNonPOJOs(recipes),
		ingredients: serializeNonPOJOs(ingredients)
	};
};
