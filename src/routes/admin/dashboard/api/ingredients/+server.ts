import getDatabase from '$db/mongo';
import { ObjectId } from 'mongodb';
import type { IngredientWithPrice } from '$lib/types';
import type { RequestHandler } from './$types';

type NewIngredient = {
	name: string;
	ean: string;
};

type UpdateIngredient = {
	_id: string;
	name: string;
	ean: string;
};

type DeleteIngredient = {
	_id: string;
};

// Create a new ingredient
export const POST: RequestHandler = async ({ request }) => {
	const db = await getDatabase();
	const newIngredient = await request.json() as NewIngredient;
	// Only allow name and ean fields to be set by user
	const { name, ean } = newIngredient;
	if (!name || !ean) {
		return new Response(JSON.stringify({ error: 'Name and EAN are required' }), { status: 400 });
	}
	try {
		const result = await db.collection('ingredients').insertOne({ name, ean });
		return new Response(JSON.stringify({ success: true, insertedId: result.insertedId }), { status: 201 });
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
};

// Update an existing ingredient
export const PUT: RequestHandler = async ({ request }) => {
	const db = await getDatabase();
	const update = await request.json() as UpdateIngredient;
	const { _id, name, ean } = update;
	if (!_id || !name || !ean) {
		return new Response(JSON.stringify({ error: 'ID, name, and EAN are required' }), { status: 400 });
	}
	try {
		const result = await db.collection('ingredients').updateOne(
			{ _id: new ObjectId(_id) },
			{ $set: { name, ean } }
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

// Delete an ingredient
export const DELETE: RequestHandler = async ({ request }) => {
	const db = await getDatabase();
	const { _id } = await request.json() as DeleteIngredient;
	if (!_id) {
		return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
	}
	try {
		const result = await db.collection('ingredients').deleteOne({ _id: new ObjectId(_id) });
		if (result.deletedCount === 1) {
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		} else {
			return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
	}
};
