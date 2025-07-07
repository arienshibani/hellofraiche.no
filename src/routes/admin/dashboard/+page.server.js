import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';

export const load = async () => {
    const db = await getDatabase();
    const recipes = await db.collection('recipes').find({}).sort({ _id: -1 }).toArray();

    return {
        recipes: serializeNonPOJOs(recipes)
    };
};