// @ts-nocheck TODO: Add types
import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";

export const load = async function ({ params }) {
	try {
		const db = await getDatabase();
		const URLparameter = params.recipeId;

		// Use the `db` object to perform database operations
		// Query the recipe DB
		const recipeData = await db
			.collection("recipes")
			.findOne({ title: URLparameter });



		// Query meal plans DB
		const query = { title: recipeData.name };
		const projection = { projection: { recipes: 1, name: 1 } }; // Exclude everything but the recipes
		const mealPlanData = await db
			.collection("mealplans")
			.findOne(query, projection);

		// Only fetch ingredients that are actually used in this recipe
		const recipeIngredientNames = recipeData.recipeIngredients?.map(ing => ing.name) || [];
		const ingredients = recipeIngredientNames.length > 0
			? await db.collection('ingredients').find({
				name: { $in: recipeIngredientNames }
			}).toArray()
			: [];


		return {
			recipe: serializeNonPOJOs(recipeData),
			mealPlan: serializeNonPOJOs(mealPlanData),
			ingredients: serializeNonPOJOs(ingredients),
		};
		// Perform queries, updates, etc.
	} catch (error) {
		console.error("Error accessing the database:", error);
	}
};
