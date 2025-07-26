import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";

export const load = async function ({ params }) {
	try {
		const db = await getDatabase();

		// Fetch all meal plans
		const mealPlansData = await db.collection("mealplans").find({}).toArray();

		// Get all unique recipe titles from all meal plans
		const allRecipeTitles = new Set();
		mealPlansData.forEach(mealPlan => {
			if (mealPlan.recipes) {
				mealPlan.recipes.forEach(recipe => {
					allRecipeTitles.add(recipe.title);
				});
			}
		});

		// Fetch all recipes that are used in meal plans
		const recipes = allRecipeTitles.size > 0
			? await db.collection('recipes').find({
				title: { $in: Array.from(allRecipeTitles) }
			}).toArray()
			: [];

		// Get all unique ingredient names from all recipes
		const allIngredientNames = new Set();
		recipes.forEach(recipe => {
			if (recipe.recipeIngredients) {
				recipe.recipeIngredients.forEach(ing => {
					allIngredientNames.add(ing.name);
				});
			}
		});

		// Fetch ingredients data for all recipe ingredients
		const ingredients = allIngredientNames.size > 0
			? await db.collection('ingredients').find({
				name: { $in: Array.from(allIngredientNames) }
			}).toArray()
			: [];

		// Calculate price for each meal plan
		const mealPlansWithPrices = mealPlansData.map(mealPlan => {
			let totalMealPlanPrice = 0;
			const recipesWithPrices = [];

			if (mealPlan.recipes) {
				mealPlan.recipes.forEach(recipe => {
					const recipeData = recipes.find(r => r.title === recipe.title);
					let recipePrice = 0;

					if (recipeData && recipeData.recipeIngredients) {
						recipeData.recipeIngredients.forEach(recipeIngredient => {
							const ingredientData = ingredients.find(ing => ing.name === recipeIngredient.name);
							if (ingredientData && ingredientData.data && ingredientData.data.products) {
								const menyProduct = ingredientData.data.products.find(product =>
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
	}
};
