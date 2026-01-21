import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";
import type { Recipe, MealPlan, IngredientWithPrice } from "$lib/types";

const serializeNonPOJOs = <T>(value: T): T => {
	return structuredClone(value);
};

export type HomePageData = {
	recipes: (Recipe & { estimatedPrice: number })[];
	mealplans: MealPlan[];
};

export const load = async (): Promise<HomePageData> => {
	try {
		const db = await getDatabase();
		// Fetch recipes (exclude drafts - only show published recipes)
		const recipes = await db.collection("recipes").find({ utkast: { $ne: true } }).toArray() as unknown as Recipe[];

		// Get all unique ingredient names from all recipes
		const allIngredientNames = new Set<string>();
		recipes.forEach((recipe: Recipe) => {
			if (recipe.recipeIngredients) {
				recipe.recipeIngredients.forEach((ing) => {
					allIngredientNames.add(ing.name);
				});
			}
		});

		// Fetch ingredients data for all recipe ingredients
		const ingredients = allIngredientNames.size > 0
			? await db.collection('ingredients').find({
				name: { $in: Array.from(allIngredientNames) }
			}).toArray() as unknown as IngredientWithPrice[]
			: [];

		// Calculate price for each recipe
		const recipesWithPrices = recipes.map((recipe: Recipe) => {
			let totalPrice = 0;

			if (recipe.recipeIngredients) {
				recipe.recipeIngredients.forEach((recipeIngredient) => {
					const ingredientData = ingredients.find((ing: IngredientWithPrice) => ing.name === recipeIngredient.name);
					// The API response is nested: data.data.products (not data.products)
					const products = ingredientData?.data?.data?.products || ingredientData?.data?.products;
					if (ingredientData && ingredientData.data && products) {
						const menyProduct = products.find((product) =>
							product.store && product.store.name === 'Meny'
						);

						if (menyProduct?.current_price?.price) {
							const productWeight = menyProduct.weight || 100;
							const price = calculateIngredientPrice(
								recipeIngredient.amount,
								recipeIngredient.measurement,
								recipeIngredient.name,
								menyProduct.current_price.price,
								productWeight
							);

							if (price !== null) {
								totalPrice += price;
							}
						}
					}
				});
			}

			return {
				...recipe,
				estimatedPrice: totalPrice
			};
		});

		// Shuffle recipes
		for (let i = recipesWithPrices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[recipesWithPrices[i], recipesWithPrices[j]] = [recipesWithPrices[j], recipesWithPrices[i]];
		}

		// Fetch mealplans
		const mealplans = await db.collection("mealplans").find({}).toArray() as unknown as MealPlan[];
		return {
			recipes: serializeNonPOJOs(recipesWithPrices),
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
