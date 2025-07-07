import getDatabase from '$db/mongo';

// @ts-ignore
export async function POST({ request }) {
    const db = await getDatabase();
    const newRecipe = await request.json();
    try {
        const result = await db.collection('recipes').insertOne(newRecipe);
        return new Response(JSON.stringify({ success: true, insertedId: result.insertedId }), { status: 201 });
    } catch (e) {
        // @ts-ignore
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
