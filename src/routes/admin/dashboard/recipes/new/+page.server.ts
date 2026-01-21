import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';
import type { IngredientWithPrice } from '$lib/types';
import type { PageServerLoad } from './$types';

export type AdminRecipeNewPageData = {
	ingredients: IngredientWithPrice[];
};

export const load: PageServerLoad = async (): Promise<AdminRecipeNewPageData> => {
	const db = await getDatabase();
	const ingredients = await db.collection('ingredients').find({}).toArray() as unknown as IngredientWithPrice[];
	
	return { 
		ingredients: serializeNonPOJOs(ingredients)
	};
};
