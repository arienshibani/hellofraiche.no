import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";
import type { Recipe, IngredientWithPrice } from "$lib/types";

const serializeNonPOJOs = <T>(value: T): T => {
	return structuredClone(value);
};

export type RecipesPageData = {
	recipes: (Recipe & { estimatedPrice: number })[];
};

export const load = async (): Promise<RecipesPageData> => {
	try {
		const db = await getDatabase();

		// Fetch all recipes (exclude drafts - only show published recipes)
		const recipes = await db.collection('recipes').find({ utkast: { $ne: true } }).toArray() as unknown as Recipe[];

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

		console.log(`[Price Debug] Found ${recipes.length} recipes`);
		console.log(`[Price Debug] Found ${allIngredientNames.size} unique ingredient names from recipes`);
		console.log(`[Price Debug] Found ${ingredients.length} ingredients with price data in DB`);
		
		// Show sample ingredient names from recipes
		const sampleRecipeIngredientNames = Array.from(allIngredientNames).slice(0, 10);
		console.log(`[Price Debug] Sample recipe ingredient names:`, sampleRecipeIngredientNames);
		
		// Show sample ingredient names from DB
		const sampleDBIngredientNames = ingredients.slice(0, 10).map(ing => ing.name);
		console.log(`[Price Debug] Sample DB ingredient names:`, sampleDBIngredientNames);
		
		// Check for name mismatches (case-insensitive)
		const dbIngredientNamesLower = new Set(ingredients.map(ing => ing.name.toLowerCase()));
		const recipeIngredientNamesLower = Array.from(allIngredientNames).map(name => name.toLowerCase());
		const missingIngredients = recipeIngredientNamesLower.filter(name => !dbIngredientNamesLower.has(name));
		if (missingIngredients.length > 0) {
			console.log(`[Price Debug] ⚠️  ${missingIngredients.length} recipe ingredient names NOT found in DB (case-insensitive):`, missingIngredients.slice(0, 10));
		}
		
		if (ingredients.length > 0) {
			const sampleIngredient = ingredients[0];
			const sampleProducts = sampleIngredient.data?.data?.products || sampleIngredient.data?.products;
			console.log(`[Price Debug] Sample ingredient from DB:`, {
				name: sampleIngredient.name,
				hasData: !!sampleIngredient.data,
				hasNestedData: !!sampleIngredient.data?.data,
				hasProducts: !!sampleProducts,
				productCount: sampleProducts?.length || 0
			});
			if (sampleProducts && sampleProducts.length > 0) {
				const menyProduct = sampleProducts.find(p => p.store?.name === 'Meny');
				console.log(`[Price Debug] Sample ingredient has Meny product:`, !!menyProduct);
				if (menyProduct) {
					console.log(`[Price Debug] Sample ingredient Meny price:`, menyProduct.current_price?.price);
				}
			}
		} else {
			console.log(`[Price Debug] ⚠️  NO ingredients found in DB! This is the problem.`);
		}

		// Calculate price for each recipe
		const recipesWithPrices = recipes.map((recipe: Recipe, recipeIndex: number) => {
			let totalPrice = 0;
			let ingredientsWithPrices = 0;
			let ingredientsWithoutPrices = 0;
			const isFirstRecipe = recipeIndex === 0;
			let loggedIngredients = 0;
			const maxLogs = 5; // Log first 5 ingredients of first recipe

			if (recipe.recipeIngredients) {
				recipe.recipeIngredients.forEach((recipeIngredient) => {
					const ingredientData = ingredients.find((ing: IngredientWithPrice) => ing.name === recipeIngredient.name);
					if (!ingredientData) {
						ingredientsWithoutPrices++;
						if (isFirstRecipe && loggedIngredients < maxLogs) {
							console.log(`[Price Debug] Ingredient "${recipeIngredient.name}" not found in ingredients DB`);
							loggedIngredients++;
						}
						return;
					}
					// The API response is nested: data.data.products (not data.products)
					const products = ingredientData.data?.data?.products || ingredientData.data?.products;
					if (!ingredientData.data || !products) {
						ingredientsWithoutPrices++;
						if (isFirstRecipe && loggedIngredients < maxLogs) {
							console.log(`[Price Debug] Ingredient "${recipeIngredient.name}" found but has no data/products`);
							loggedIngredients++;
						}
						return;
					}
					const menyProduct = products.find((product) =>
						product.store && product.store.name === 'Meny'
					);

					if (!menyProduct) {
						ingredientsWithoutPrices++;
						if (isFirstRecipe && loggedIngredients < maxLogs) {
							const stores = products.map(p => p.store?.name).filter(Boolean);
							console.log(`[Price Debug] Ingredient "${recipeIngredient.name}" found but no Meny product. Available stores:`, stores);
							loggedIngredients++;
						}
						return;
					}
					if (!menyProduct.current_price?.price) {
						ingredientsWithoutPrices++;
						if (isFirstRecipe && loggedIngredients < maxLogs) {
							console.log(`[Price Debug] Ingredient "${recipeIngredient.name}" has Meny product but no price. Price structure:`, JSON.stringify(menyProduct.current_price, null, 2));
							loggedIngredients++;
						}
						return;
					}

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
						ingredientsWithPrices++;
					} else {
						ingredientsWithoutPrices++;
					}
				});
			}

			if (recipe.title && (ingredientsWithPrices > 0 || ingredientsWithoutPrices > 0)) {
				console.log(`[Price Debug] Recipe "${recipe.title}": ${ingredientsWithPrices} ingredients with prices, ${ingredientsWithoutPrices} without, total: ${totalPrice.toFixed(2)} kr`);
			}

			return {
				...recipe,
				estimatedPrice: totalPrice
			};
		});

		return {
			recipes: serializeNonPOJOs(recipesWithPrices),
		};
	} catch (error) {
		console.error('Error accessing the database:', error);
		return {
			recipes: [],
		};
	}
};
