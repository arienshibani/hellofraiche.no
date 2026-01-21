import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";
import type { MealPlan, Recipe, IngredientWithPrice, MealPlanRecipe } from "$lib/types";

export type MealPlanDetailPageData = {
	mealPlan: MealPlan & {
		recipes: (MealPlanRecipe & { estimatedPrice: number })[];
		estimatedPrice: number;
	};
	nextMealPlanId: string | undefined;
	previousMealPlanId: string | undefined;
};

export const load = async ({ params }: { params: { mealPlanId: string } }): Promise<MealPlanDetailPageData> => {
	try {
		const db = await getDatabase();

		// Do database stuff
		const URLparameters = params.mealPlanId;
		let mealPlanData = await db.collection('mealplans').findOne({ "name": URLparameters }) as unknown as MealPlan | null;
		if (mealPlanData === null) {
			mealPlanData = await db.collection('mealplans').findOne({ "mealPlanId": URLparameters }) as unknown as MealPlan | null;
		}

		if (!mealPlanData) {
			throw new Error(`Meal plan not found: ${URLparameters}`);
		}

		// Fetch all recipes for this meal plan (exclude drafts)
		const recipeTitles = mealPlanData.recipes?.map((recipe: MealPlanRecipe) => recipe.title).filter((title): title is string => title !== undefined) || [];
		const recipes = recipeTitles.length > 0
			? await db.collection('recipes').find({
				title: { $in: recipeTitles },
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

		// Calculate price for each recipe and total meal plan
		let totalMealPlanPrice = 0;
		const recipesWithPrices = mealPlanData.recipes?.map((recipe: MealPlanRecipe) => {
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

			totalMealPlanPrice += recipePrice;

			return {
				...recipe,
				estimatedPrice: recipePrice
			};
		}) || [];

		// Update meal plan data with pricing information
		const updatedMealPlanData: MealPlan & {
			recipes: (MealPlanRecipe & { estimatedPrice: number })[];
			estimatedPrice: number;
		} = {
			...mealPlanData,
			recipes: recipesWithPrices,
			estimatedPrice: totalMealPlanPrice
		};

		const allMealPlansData = await db.collection('mealplans').find({}, { projection: { mealPlanId: 1, name: 1 } }).toArray() as unknown as Pick<MealPlan, 'mealPlanId' | 'name'>[];

		// Find the index of the current mealplan in the Array of all meal plans.
		const currentIndex = allMealPlansData.findIndex((el) => el.mealPlanId === params.mealPlanId);

		// Find the next, and previous mealplan as well for the buttons.
		const nextMealPlanId = allMealPlansData[currentIndex + 1]?.mealPlanId || allMealPlansData[0]?.mealPlanId; // (Cycle to first if out of bounds)
		const previousMealPlanId = allMealPlansData[currentIndex - 1]?.mealPlanId || allMealPlansData[allMealPlansData.length - 1]?.mealPlanId; // (Cycle to last if out of bounds)

		return {
			mealPlan: serializeNonPOJOs(updatedMealPlanData),
			nextMealPlanId: nextMealPlanId,
			previousMealPlanId: previousMealPlanId,
		};

		// Perform queries, updates, etc.
	} catch (error) {
		console.error('Error accessing the database:', error);
		throw error;
	}
};
