// Ingredient densities (g/ml for liquids, g/cm³ for solids)
const INGREDIENT_DENSITIES: Record<string, number> = {
  // Liquids
  'Matfløte': 1.02,
  'Kremfløte': 1.00,
  'Melk': 1.03,
  'Vann': 1.00,
  'Olivenolje': 0.91,
  'Rapsolje': 0.92,
  'Soya saus': 1.18,
  'Balsamico eddik': 1.05,
  'Hvitvinseddik': 1.01,
  'Sitron juice': 1.03,
  'Lime juice': 1.03,

  // Semi-liquids
  'Honning': 1.42,
  'Sirup': 1.33,
  'Marmelade': 1.40,
  'Ketchup': 1.15,
  'Majones': 0.92,
  'Sennep': 1.24,

  // Powders/Granular
  'Hvetemel': 0.59,
  'Sukker': 0.85,
  'Salt': 1.20,
  'Bakepulver': 0.91,
  'Natron': 2.20,
  'Kakao': 0.55,
  'Kaffe': 0.40,

  // Default density for unknown liquids
  'default_liquid': 1.00,
  'default_powder': 0.60,
};

// Package sizes for count-based ingredients (g per unit)
const PACKAGE_SIZES: Record<string, number> = {
  // Common ingredients
  'Hvitløksfedd': 3,
  'Egg': 60,
  'Tomat': 120,
  'Løk': 100,
  'Potet': 150,
  'Eple': 150,
  'Banan': 120,
  'Sitron': 100,
  'Lime': 80,
  'Avokado': 200,
  'Agurk': 100,
  'Paprika': 120,
  'Chili': 15,
  'Ingefær': 20,
  'Kurkuma': 5,

  // Default size for unknown items
  'default': 50,
};

// Type definitions
export interface NutritionItem {
  code: string;
  display_name: string;
  amount: number;
  unit: string;
}

/**
 * Convert Norwegian cooking units to grams
 * @param {number} amount - The amount to convert
 * @param {string} measurement - The measurement unit
 * @param {string} ingredientName - The ingredient name for density/package size lookup
 * @returns {number} - Weight in grams
 */
export function convertToGrams(amount: number, measurement: string, ingredientName: string = ''): number {
  if (!amount || !measurement) return 0;

  const unit = measurement.toLowerCase();

  // Handle standard weight units
  if (unit === 'g') return amount;
  if (unit === 'kg') return amount * 1000;

  // Handle Norwegian volume units
  if (unit === 'dl') {
    const ml = amount * 100;
    return convertVolumeToWeight(ml, ingredientName);
  }

  if (unit === 'ss') {
    const ml = amount * 15;
    return convertVolumeToWeight(ml, ingredientName);
  }

  if (unit === 'ts') {
    const ml = amount * 5;
    return convertVolumeToWeight(ml, ingredientName);
  }

  // Handle count-based units
  if (unit === 'stk' || unit === 'boks' || unit === 'pakke') {
    return convertCountToWeight(amount, ingredientName);
  }

  // Unknown unit - return amount as-is (assume grams)
  console.warn(`Unknown measurement unit: ${measurement} for ${ingredientName}`);
  return amount;
}

/**
 * Convert volume (ml) to weight (g) using ingredient density
 * @param {number} ml - Volume in milliliters
 * @param {string} ingredientName - The ingredient name
 * @returns {number} - Weight in grams
 */
function convertVolumeToWeight(ml: number, ingredientName: string): number {
  const density = INGREDIENT_DENSITIES[ingredientName] ||
                  INGREDIENT_DENSITIES['default_liquid'];
  return ml * density;
}

/**
 * Convert count to weight using package size
 * @param {number} count - Number of items
 * @param {string} ingredientName - The ingredient name
 * @returns {number} - Weight in grams
 */
function convertCountToWeight(count: number, ingredientName: string): number {
  const packageSize = PACKAGE_SIZES[ingredientName] || PACKAGE_SIZES['default'];
  return count * packageSize;
}

/**
 * Calculate accurate ingredient price based on weight
 * @param {number} recipeAmount - Amount from recipe
 * @param {string} recipeMeasurement - Measurement from recipe
 * @param {string} ingredientName - Ingredient name
 * @param {number} productPrice - Price from Kassal.app product
 * @param {number} productWeight - Weight from Kassal.app product (g)
 * @returns {number | null} - Calculated price
 */
export function calculateIngredientPrice(
  recipeAmount: number,
  recipeMeasurement: string,
  ingredientName: string,
  productPrice: number,
  productWeight: number
): number | null {
  if (!productPrice || !productWeight) return null;

  const recipeWeight = convertToGrams(recipeAmount, recipeMeasurement, ingredientName);
  const pricePerGram = productPrice / productWeight;
  return recipeWeight * pricePerGram;
}

/**
 * Calculate accurate nutrition values based on weight
 * @param {number} recipeAmount - Amount from recipe
 * @param {string} recipeMeasurement - Measurement from recipe
 * @param {string} ingredientName - Ingredient name
 * @param {NutritionItem[]} nutritionData - Nutrition data from Kassal.app
 * @param {number} productWeight - Weight from Kassal.app product (g)
 * @returns {NutritionItem[]} - Calculated nutrition values
 */
export function calculateIngredientNutrition(
  recipeAmount: number,
  recipeMeasurement: string,
  ingredientName: string,
  nutritionData: NutritionItem[],
  productWeight: number
): NutritionItem[] {
  if (!nutritionData || !productWeight) return [];

  const recipeWeight = convertToGrams(recipeAmount, recipeMeasurement, ingredientName);
  const weightRatio = recipeWeight / productWeight;

  return nutritionData.map(nutrition => ({
    ...nutrition,
    amount: nutrition.amount * weightRatio
  }));
}

/**
 * Get ingredient density for a given ingredient
 * @param {string} ingredientName - The ingredient name
 * @returns {number} - Density in g/ml
 */
export function getIngredientDensity(ingredientName: string): number {
  return INGREDIENT_DENSITIES[ingredientName] || INGREDIENT_DENSITIES['default_liquid'];
}

/**
 * Get package size for a given ingredient
 * @param {string} ingredientName - The ingredient name
 * @returns {number} - Weight in grams per unit
 */
export function getPackageSize(ingredientName: string): number {
  return PACKAGE_SIZES[ingredientName] || PACKAGE_SIZES['default'];
}

/**
 * Add a new ingredient density to the database
 * @param {string} ingredientName - The ingredient name
 * @param {number} density - Density in g/ml
 */
export function addIngredientDensity(ingredientName: string, density: number): void {
  INGREDIENT_DENSITIES[ingredientName] = density;
}

/**
 * Add a new package size to the database
 * @param {string} ingredientName - The ingredient name
 * @param {number} weight - Weight in grams per unit
 */
export function addPackageSize(ingredientName: string, weight: number): void {
  PACKAGE_SIZES[ingredientName] = weight;
}

/**
 * Get all available densities (for admin interface)
 * @returns {Record<string, number>} - All ingredient densities
 */
export function getAllDensities(): Record<string, number> {
  return { ...INGREDIENT_DENSITIES };
}

/**
 * Get all available package sizes (for admin interface)
 * @returns {Record<string, number>} - All package sizes
 */
export function getAllPackageSizes(): Record<string, number> {
  return { ...PACKAGE_SIZES };
}
