import getDatabase from '$db/mongo';
import { ObjectId } from 'mongodb';

// @ts-ignore
export async function DELETE({ params }) {
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
}

export async function PUT({ params, request }) {
    const db = await getDatabase();
    let id = params.id;
    if (typeof id !== 'string') id = String(id);
    const updatedRecipe = await request.json();

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
}