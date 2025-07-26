// @ts-ignore
import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";

const serializeNonPOJOs = (value) => {
  return structuredClone(value)
};

export const load = async function () {
  try {
    const db = await getDatabase();

    // Fetch all recipes
    const recipes = await db.collection('recipes').find({}).toArray();

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

    // Calculate price for each recipe
    const recipesWithPrices = recipes.map(recipe => {
      let totalPrice = 0;

      if (recipe.recipeIngredients) {
        recipe.recipeIngredients.forEach(recipeIngredient => {
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

    return {
      recipes: serializeNonPOJOs(recipesWithPrices),
    }
  } catch (error) {
    console.error('Error accessing the database:', error);
  }
}
