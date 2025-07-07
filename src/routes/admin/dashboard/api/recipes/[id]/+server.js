import getDatabase from '$db/mongo';

// @ts-ignore
export async function DELETE({ params }) {
    const db = await getDatabase();
    // Extract the string ID if params.id is an object (e.g., { $oid: '...' })
    let id = params.id;
    // @ts-ignore
    if (typeof id === 'object' && id.$oid) id = id.$oid;
    console.log(`Deleting recipe with ID: ${id}`);
    try {
        const result = await db.collection('recipes').deleteOne({ _id: typeof id === 'string' && id.length === 24 ? new (await import('mongodb')).ObjectId(id) : id });
        if (result.deletedCount === 1) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
        }
    } catch (e) {
        // @ts-ignore
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
} 