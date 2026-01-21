import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';
import { ObjectId } from 'mongodb';
import type { Recipe, IngredientWithPrice } from '$lib/types';
import type { PageServerLoad } from './$types';

export type AdminRecipeEditPageData = {
	recipe: Recipe | null;
	ingredients: IngredientWithPrice[];
};

export const load: PageServerLoad = async ({ params }): Promise<AdminRecipeEditPageData> => {
	const db = await getDatabase();
	const id = typeof params.id === 'string' && params.id.length === 24 ? new ObjectId(params.id) : params.id;
	const recipe = await db.collection('recipes').findOne({ _id: id as any }) as unknown as Recipe | null;
	const ingredients = await db.collection('ingredients').find({}).toArray() as unknown as IngredientWithPrice[];
	return { 
		recipe: serializeNonPOJOs(recipe),
		ingredients: serializeNonPOJOs(ingredients)
	};
};
