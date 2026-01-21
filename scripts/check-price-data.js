/**
 * Diagnostic script to check price data in the database
 * Run with: node scripts/check-price-data.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI environment variable is not set');
  process.exit(1);
}

async function checkPriceData() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db();

    // Check recipes - try both with and without utkast filter
    const allRecipes = await db.collection('recipes').find({}).toArray();
    const publishedRecipes = await db.collection('recipes').find({ utkast: { $ne: true } }).toArray();
    const recipes = publishedRecipes.slice(0, 3); // Get first 3 for display
    
    console.log(`Total recipes in DB: ${allRecipes.length}`);
    console.log(`Published recipes (utkast != true): ${publishedRecipes.length}`);
    console.log(`\nFound ${recipes.length} sample recipes:`);
    recipes.forEach((recipe, idx) => {
      console.log(`\n${idx + 1}. Recipe: "${recipe.title}"`);
      console.log(`   Utkast: ${recipe.utkast}`);
      console.log(`   Ingredients: ${recipe.recipeIngredients?.length || 0}`);
      if (recipe.recipeIngredients && recipe.recipeIngredients.length > 0) {
        console.log(`   Sample ingredients:`, recipe.recipeIngredients.slice(0, 5).map(ing => `"${ing.name}"`));
      }
    });

    // Check ingredients - use ALL published recipes to get ingredient names
    const allIngredientNames = new Set();
    publishedRecipes.forEach(recipe => {
      if (recipe.recipeIngredients) {
        recipe.recipeIngredients.forEach(ing => {
          allIngredientNames.add(ing.name);
        });
      }
    });

    console.log(`\n\nChecking ${allIngredientNames.size} unique ingredient names from all published recipes...`);
    const ingredientNamesArray = Array.from(allIngredientNames);
    console.log(`Sample ingredient names:`, ingredientNamesArray.slice(0, 10));
    
    const ingredients = await db.collection('ingredients').find({
      name: { $in: ingredientNamesArray }
    }).toArray();
    
    // Also check total ingredients in DB
    const totalIngredients = await db.collection('ingredients').countDocuments();
    console.log(`Total ingredients in DB: ${totalIngredients}`);

    console.log(`Found ${ingredients.length} ingredients in database:`);
    ingredients.forEach((ing, idx) => {
      console.log(`\n${idx + 1}. Ingredient: "${ing.name}"`);
      console.log(`   Has data: ${!!ing.data}`);
      if (ing.data) {
        console.log(`   Has products: ${!!ing.data.products}`);
        if (ing.data.products) {
          console.log(`   Product count: ${ing.data.products.length}`);
          const menyProduct = ing.data.products.find(p => p.store?.name === 'Meny');
          if (menyProduct) {
            console.log(`   Meny product found: YES`);
            console.log(`   Has price: ${!!menyProduct.current_price?.price}`);
            if (menyProduct.current_price?.price) {
              console.log(`   Price: ${menyProduct.current_price.price} kr`);
              console.log(`   Weight: ${menyProduct.weight || 'N/A'} g`);
            } else {
              console.log(`   Price data structure:`, JSON.stringify(menyProduct.current_price, null, 2));
            }
          } else {
            console.log(`   Meny product found: NO`);
            console.log(`   Available stores:`, ing.data.products.map(p => p.store?.name).filter(Boolean));
          }
        }
      } else {
        console.log(`   No data field found`);
      }
    });

    // Summary
    console.log(`\n\n=== SUMMARY ===`);
    console.log(`Total recipes checked: ${recipes.length}`);
    console.log(`Total unique ingredient names: ${allIngredientNames.size}`);
    console.log(`Ingredients found in DB: ${ingredients.length}`);
    const ingredientsWithMenyPrices = ingredients.filter(ing => {
      const menyProduct = ing.data?.products?.find(p => p.store?.name === 'Meny');
      return menyProduct?.current_price?.price;
    });
    console.log(`Ingredients with Meny prices: ${ingredientsWithMenyPrices.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\n\nConnection closed');
  }
}

checkPriceData();
