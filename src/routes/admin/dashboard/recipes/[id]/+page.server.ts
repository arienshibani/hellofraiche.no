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
	const id = params.id;
	
	let recipe: Recipe | null = null;
	
	// Try to find by _id first (if it's a valid ObjectId)
	if (typeof id === 'string' && id.length === 24) {
		try {
			recipe = await db.collection('recipes').findOne({ _id: new ObjectId(id) }) as unknown as Recipe | null;
		} catch (e) {
			// Invalid ObjectId, continue to try by title
		}
	}
	
	// If not found by _id, try to find by title (URL-encoded)
	if (!recipe && id) {
		const decodedTitle = decodeURIComponent(id);
		recipe = await db.collection('recipes').findOne({ title: decodedTitle }) as unknown as Recipe | null;
	}
	
	const ingredients = await db.collection('ingredients').find({}).toArray() as unknown as IngredientWithPrice[];
	
	return { 
		recipe: serializeNonPOJOs(recipe),
		ingredients: serializeNonPOJOs(ingredients)
	};
};
