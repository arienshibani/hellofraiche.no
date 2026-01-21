import getDatabase from '$db/mongo';
import type { Recipe } from '$lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const db = await getDatabase();
	const newRecipe = await request.json() as Recipe;
	try {
		const result = await db.collection('recipes').insertOne(newRecipe as any);
		return new Response(JSON.stringify({ success: true, insertedId: result.insertedId }), { status: 201 });
	} catch (e) {
		const error = e as Error;
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
};
