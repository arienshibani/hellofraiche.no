import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";
// @ts-ignore

export const load = async function ({ params }) {
	try {
		const db = await getDatabase();
		const URLparameter = params.recipeId;
		console.log(URLparameter);
		// Use the `db` object to perform database operations
		// Query the recipe DB
		const mealPlansData = await db.collection("mealplans").find({}).toArray();

		return {
			mealPlans: serializeNonPOJOs(mealPlansData),
		};
		// Perform queries, updates, etc.
	} catch (error) {
		console.error("Error accessing the database:", error);
	}
};
