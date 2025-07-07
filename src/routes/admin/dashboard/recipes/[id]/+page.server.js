import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';

export const load = async ({ params }) => {
    const db = await getDatabase();
    const recipe = await db.collection('recipes').findOne({ _id: typeof params.id === 'string' && params.id.length === 24 ? new (await import('mongodb')).ObjectId(params.id) : params.id });
    return { recipe: serializeNonPOJOs(recipe) };
};