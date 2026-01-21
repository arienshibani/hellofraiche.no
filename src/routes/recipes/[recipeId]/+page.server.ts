import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";
import type { RecipePageData, Recipe, MealPlan, IngredientWithPrice } from "$lib/types";

export const load = async ({ params }: { params: { recipeId: string } }): Promise<RecipePageData> => {
	try {
		const db = await getDatabase();
		const URLparameter = params.recipeId;

		// Use the `db` object to perform database operations
		// Query the recipe DB
		const recipeData = await db
			.collection("recipes")
			.findOne({ title: URLparameter }) as unknown as Recipe | null;

		if (!recipeData) {
			throw new Error(`Recipe not found: ${URLparameter}`);
		}

		// Query meal plans DB - find meal plan that contains this recipe
		// Look for meal plans where any recipe has a matching recipeId or title
		const projection = { projection: { recipes: 1, name: 1 } }; // Exclude everything but the recipes
		const mealPlanData = await db
			.collection("mealplans")
			.findOne({ 
				"recipes.recipeId": recipeData.recipeId 
			}, projection) as unknown as MealPlan | null;

		// Only fetch ingredients that are actually used in this recipe
		const recipeIngredientNames = recipeData.recipeIngredients?.map((ing: { name: string }) => ing.name) || [];
		const ingredients = recipeIngredientNames.length > 0
			? await db.collection('ingredients').find({
				name: { $in: recipeIngredientNames }
			}).toArray() as unknown as IngredientWithPrice[]
			: [];

		const result: RecipePageData = {
			recipe: serializeNonPOJOs(recipeData),
			mealPlan: serializeNonPOJOs(mealPlanData),
			ingredients: serializeNonPOJOs(ingredients),
		};

		return result;
	} catch (error) {
		console.error("Error accessing the database:", error);
		throw error;
	}
};
