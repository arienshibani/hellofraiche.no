import getDatabase from '$db/mongo';
import { ObjectId } from 'mongodb';
import type { Recipe } from '$lib/types';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	const db = await getDatabase();
	let id = params.id;
	// Ensure id is a string
	if (typeof id !== 'string') id = String(id);
	console.log(`Deleting recipe with ID: ${id}`);
	try {
		const result = await db.collection('recipes').deleteOne({ _id: id.length === 24 ? new ObjectId(id) : id });
		if (result.deletedCount === 1) {
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		} else {
			return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const db = await getDatabase();
	let id = params.id;
	// Ensure id is a string
	if (typeof id !== 'string') id = String(id);
	const updatedRecipe = await request.json() as Recipe;

	// Remove _id if present
	if ('_id' in updatedRecipe) {
		delete updatedRecipe._id;
	}

	try {
		const result = await db.collection('recipes').updateOne(
			{ _id: new ObjectId(id) },
			{ $set: updatedRecipe }
		);
		if (result.matchedCount === 1) {
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		} else {
			return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
};

type PatchData = 
	| { markBulk: string }
	| { updateEAN: { name: string; ean: string } }
	| { toggleUtkast: boolean };

export const PATCH: RequestHandler = async ({ params, request }) => {
	const db = await getDatabase();
	let id = params.id;
	// Ensure id is a string
	if (typeof id !== 'string') id = String(id);
	const patchData = await request.json() as PatchData;

	try {
		if ('markBulk' in patchData) {
			// Mark an ingredient as bulk item
			const result = await db.collection('recipes').updateOne(
				{
					_id: new ObjectId(id),
					'recipeIngredients.name': patchData.markBulk
				},
				{
					$set: {
						'recipeIngredients.$.isBulkItem': true
					}
				}
			);
			if (result.matchedCount === 1) {
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			} else {
				return new Response(JSON.stringify({ error: 'Recipe or ingredient not found' }), { status: 404 });
			}
		} else if ('updateEAN' in patchData) {
			// Update an ingredient's EAN in the recipe
			const result = await db.collection('recipes').updateOne(
				{
					_id: new ObjectId(id),
					'recipeIngredients.name': patchData.updateEAN.name
				},
				{
					$set: {
						'recipeIngredients.$.ean': patchData.updateEAN.ean
					}
				}
			);
			if (result.matchedCount === 1) {
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			} else {
				return new Response(JSON.stringify({ error: 'Recipe or ingredient not found' }), { status: 404 });
			}
		} else if ('toggleUtkast' in patchData) {
			// Toggle draft status
			const result = await db.collection('recipes').updateOne(
				{ _id: new ObjectId(id) },
				{ $set: { utkast: patchData.toggleUtkast } }
			);
			if (result.matchedCount === 1) {
				return new Response(JSON.stringify({ success: true }), { status: 200 });
			} else {
				return new Response(JSON.stringify({ error: 'Recipe not found' }), { status: 404 });
			}
		} else {
			return new Response(JSON.stringify({ error: 'Invalid patch operation' }), { status: 400 });
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
};
