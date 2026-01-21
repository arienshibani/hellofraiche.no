import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";
import type { MealPlan, Recipe, IngredientWithPrice, MealPlanRecipe } from "$lib/types";

export type MealPlansPageData = {
	mealPlans: (MealPlan & {
		recipes: (MealPlanRecipe & { estimatedPrice: number })[];
		estimatedPrice: number;
	})[];
};

export const load = async (): Promise<MealPlansPageData> => {
	try {
		const db = await getDatabase();

		// Fetch all meal plans
		const mealPlansData = await db.collection("mealplans").find({}).toArray() as unknown as MealPlan[];

		// Get all unique recipe titles from all meal plans
		const allRecipeTitles = new Set<string>();
		mealPlansData.forEach((mealPlan: MealPlan) => {
			if (mealPlan.recipes) {
				mealPlan.recipes.forEach((recipe: MealPlanRecipe) => {
					if (recipe.title) {
						allRecipeTitles.add(recipe.title);
					}
				});
			}
		});

		// Fetch all recipes that are used in meal plans (exclude drafts)
		const recipes = allRecipeTitles.size > 0
			? await db.collection('recipes').find({
				title: { $in: Array.from(allRecipeTitles) },
				utkast: { $ne: true }
			}).toArray() as unknown as Recipe[]
			: [];

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

		// Calculate price for each meal plan
		const mealPlansWithPrices = mealPlansData.map((mealPlan: MealPlan) => {
			let totalMealPlanPrice = 0;
			const recipesWithPrices: (MealPlanRecipe & { estimatedPrice: number })[] = [];

			if (mealPlan.recipes) {
				mealPlan.recipes.forEach((recipe: MealPlanRecipe) => {
					const recipeData = recipes.find((r: Recipe) => r.title === recipe.title);
					let recipePrice = 0;

					if (recipeData && recipeData.recipeIngredients) {
						recipeData.recipeIngredients.forEach((recipeIngredient) => {
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
										recipePrice += price;
									}
								}
							}
						});
					}

					recipesWithPrices.push({
						...recipe,
						estimatedPrice: recipePrice
					});

					totalMealPlanPrice += recipePrice;
				});
			}

			return {
				...mealPlan,
				recipes: recipesWithPrices,
				estimatedPrice: totalMealPlanPrice
			};
		});

		return {
			mealPlans: serializeNonPOJOs(mealPlansWithPrices),
		};
	} catch (error) {
		console.error("Error accessing the database:", error);
		return {
			mealPlans: [],
		};
	}
};
