
import { mealplans } from "$db/mealplans";
import { serializeNonPOJOs } from "$lib/util/serializeNonPOJOs";
import getDatabase from "$db/mongo";
import { calculateIngredientPrice } from "$lib/util/conversions";

export const load = async function ({ params }) {
  try {
    const db = await getDatabase();

    // Do database stuff
    const URLparameters = params.mealPlanId
    let mealPlanData = await db.collection('mealplans').findOne({ "name": URLparameters });
    if (mealPlanData === null) {
      let mealPlanData = await db.collection('mealplans').findOne({ "mealPlanId": URLparameters });
    }

    // Fetch all recipes for this meal plan
    const recipeTitles = mealPlanData.recipes?.map(recipe => recipe.title) || [];
    const recipes = recipeTitles.length > 0
      ? await db.collection('recipes').find({
        title: { $in: recipeTitles }
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

    // Calculate price for each recipe and total meal plan
    let totalMealPlanPrice = 0;
    const recipesWithPrices = mealPlanData.recipes?.map(recipe => {
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

      totalMealPlanPrice += recipePrice;

      return {
        ...recipe,
        estimatedPrice: recipePrice
      };
    }) || [];

    // Update meal plan data with pricing information
    mealPlanData = {
      ...mealPlanData,
      recipes: recipesWithPrices,
      estimatedPrice: totalMealPlanPrice
    };

    const allMealPlansData = await db.collection('mealplans').find({}, { projection: { mealPlanId: 1, name: 1 } }).toArray()

    // Find the index of the current mealplan in the Array of all meal plans.
    const currentIndex = allMealPlansData.findIndex(el => el.mealPlanId === params.mealPlanId)

    // Find the next, and previous mealplan as well for the buttons.
    const nextMealPlanId = allMealPlansData[currentIndex + 1]?.mealPlanId || allMealPlansData[0]?.mealPlanId // (Cycle to first if out of bounds)
    const previousMealPlanId = allMealPlansData[currentIndex - 1]?.mealPlanId || allMealPlansData[allMealPlansData.length - 1]?.mealPlanId // (Cycle to last if out of bounds)

    return {
      mealPlan: serializeNonPOJOs(mealPlanData),
      nextMealPlanId: nextMealPlanId,
      previousMealPlanId: previousMealPlanId,
    }

    // Perform queries, updates, etc.
  } catch (error) {
    console.error('Error accessing the database:', error);
  }
}
