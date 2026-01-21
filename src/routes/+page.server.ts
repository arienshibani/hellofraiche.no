import getDatabase from "$db/mongo";
import type { Recipe, MealPlan } from "$lib/types";

const serializeNonPOJOs = <T>(value: T): T => {
	return structuredClone(value);
};

export type HomePageData = {
	recipes: Recipe[];
	mealplans: MealPlan[];
};

export const load = async (): Promise<HomePageData> => {
	try {
		const db = await getDatabase();
		// Fetch recipes
		const recipes = await db.collection("recipes").find({}).toArray() as unknown as Recipe[];
		// Shuffle recipes
		for (let i = recipes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[recipes[i], recipes[j]] = [recipes[j], recipes[i]];
		}
		// Fetch mealplans
		const mealplans = await db.collection("mealplans").find({}).toArray() as unknown as MealPlan[];
		return {
			recipes: serializeNonPOJOs(recipes),
			mealplans: serializeNonPOJOs(mealplans),
		};
	} catch (error) {
		console.error("Error accessing the database:", error);
		// Return empty arrays to prevent component errors
		return {
			recipes: [],
			mealplans: [],
		};
	}
};
