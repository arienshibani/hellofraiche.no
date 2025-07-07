import getDatabase from '$db/mongo';

// Create a new ingredient
export async function POST({ request }) {
    const db = await getDatabase();
    const newIngredient = await request.json();
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
}

// Update an existing ingredient
export async function PUT({ request }) {
    const db = await getDatabase();
    const update = await request.json();
    const { _id, name, ean } = update;
    if (!_id || !name || !ean) {
        return new Response(JSON.stringify({ error: 'ID, name, and EAN are required' }), { status: 400 });
    }
    try {
        const { ObjectId } = await import('mongodb');
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
}

// Delete an ingredient
export async function DELETE({ request }) {
    const db = await getDatabase();
    const { _id } = await request.json();
    if (!_id) {
        return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
    }
    try {
        const { ObjectId } = await import('mongodb');
        const result = await db.collection('ingredients').deleteOne({ _id: new ObjectId(_id) });
        if (result.deletedCount === 1) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
}