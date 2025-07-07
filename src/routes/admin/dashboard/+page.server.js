import getDatabase from '$db/mongo';
import { serializeNonPOJOs } from '$lib/util/serializeNonPOJOs';

export const load = async () => {
    const db = await getDatabase();
    const recipes = await db.collection('recipes').find({}).sort({ _id: -1 }).toArray();
    const ingredients = await db.collection('ingredients').find({}).toArray();

    return {
        recipes: serializeNonPOJOs(recipes),
        ingredients: serializeNonPOJOs(ingredients)
    };
};