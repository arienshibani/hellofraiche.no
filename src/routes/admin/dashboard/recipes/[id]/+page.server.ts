import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';
import { ObjectId } from 'mongodb';
import type { Recipe } from '$lib/types';
import type { PageServerLoad } from './$types';

export type AdminRecipeEditPageData = {
	recipe: Recipe | null;
};

export const load: PageServerLoad = async ({ params }): Promise<AdminRecipeEditPageData> => {
	const db = await getDatabase();
	const id = typeof params.id === 'string' && params.id.length === 24 ? new ObjectId(params.id) : params.id;
	const recipe = await db.collection('recipes').findOne({ _id: id as any }) as unknown as Recipe | null;
	return { recipe: serializeNonPOJOs(recipe) };
};
