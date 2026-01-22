import { debugLog } from '$lib/util/logger';

// All supported measurement units in the system
export const MEASUREMENT_UNITS = {
  // Weight units
  WEIGHT: ['g', 'kg'] as const,
  
  // Volume units
  VOLUME: ['ml', 'l', 'dl', 'ss', 'ts'] as const,
  
  // Count-based units
  COUNT: ['stk', 'boks', 'pakke', 'båt', 'pk', 'potte'] as const,
  
  // Small amount units
  SMALL_AMOUNTS: ['klype', 'knivspiss'] as const,
} as const;

// Measurement unit descriptions and translations
export const MEASUREMENT_UNIT_INFO: Record<MeasurementUnit, { 
  name: string; 
  description: string; 
  category: string;
  conversionFactor?: number; // For units that convert to base units
}> = {
  // Weight units
  'g': { name: 'Gram', description: 'Gram (weight)', category: 'Weight' },
  'kg': { name: 'Kilogram', description: 'Kilogram (weight)', category: 'Weight', conversionFactor: 1000 },
  
  // Volume units
  'ml': { name: 'Milliliter', description: 'Milliliter (volume)', category: 'Volume' },
  'l': { name: 'Liter', description: 'Liter (volume)', category: 'Volume', conversionFactor: 1000 },
  'dl': { name: 'Desiliter', description: 'Desiliter (volume)', category: 'Volume', conversionFactor: 100 },
  'ss': { name: 'Spiseskje', description: 'Spiseskje (tablespoon)', category: 'Volume', conversionFactor: 15 },
  'ts': { name: 'Teske', description: 'Teske (teaspoon)', category: 'Volume', conversionFactor: 5 },
  
  // Count-based units
  'stk': { name: 'Stykke', description: 'Stykke (piece)', category: 'Count' },
  'boks': { name: 'Boks', description: 'Boks (box)', category: 'Count' },
  'pakke': { name: 'Pakke', description: 'Pakke (package)', category: 'Count' },
  'båt': { name: 'Båt', description: 'Båt (clove)', category: 'Count' },
  'pk': { name: 'Pakke', description: 'Pakke (package)', category: 'Count' },
  'potte': { name: 'Potte', description: 'Potte (pot)', category: 'Count' },
  
  // Small amount units
  'klype': { name: 'Klype', description: 'Klype (pinch)', category: 'Small Amount', conversionFactor: 0.5 },
  'knivspiss': { name: 'Knivspiss', description: 'Knivspiss (knife tip)', category: 'Small Amount', conversionFactor: 0.3 },
} as const;

// Flattened array of all measurement units
export const ALL_MEASUREMENT_UNITS = [
  ...MEASUREMENT_UNITS.WEIGHT,
  ...MEASUREMENT_UNITS.VOLUME,
  ...MEASUREMENT_UNITS.COUNT,
  ...MEASUREMENT_UNITS.SMALL_AMOUNTS,
] as const;

// Type for measurement units (union of all possible values)
export type MeasurementUnit = typeof ALL_MEASUREMENT_UNITS[number];

// Type for specific measurement categories
export type WeightUnit = typeof MEASUREMENT_UNITS.WEIGHT[number];
export type VolumeUnit = typeof MEASUREMENT_UNITS.VOLUME[number];
export type CountUnit = typeof MEASUREMENT_UNITS.COUNT[number];
export type SmallAmountUnit = typeof MEASUREMENT_UNITS.SMALL_AMOUNTS[number];

// Ingredient densities (g/ml for liquids, g/cm³ for solids)
const INGREDIENT_DENSITIES: Record<string, number> = {
  // Liquids
  'Matfløte': 1.02,  // Heavy cream
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
  
  // Norwegian-specific ingredients
  'Rømme': 1.05,      // Sour cream
  'Kvarg': 1.10,      // Quark/curd cheese
  'Brunost': 1.15,    // Brown cheese
  'Geitost': 1.12,    // Goat cheese
  'Lefse': 0.45,      // Norwegian flatbread

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
  'Nakkekoteletter': 225,

  // Norwegian-specific units
  'Hvitløk': 50,      // båt (clove) - average weight per clove
  'Sukkererter': 100, // pk (package) - typical frozen pea package
  'Ruccola': 60,      // pk (package) - typical arugula package
  'Mynte': 30,        // potte (pot) - small herb pot
  
  // Additional common Norwegian ingredients
  'Basilikum': 25,    // potte (potted basil)
  'Persille': 20,     // potte (potted parsley)
  'Timian': 15,       // potte (potted thyme)
  'Rosmarin': 20,     // potte (potted rosemary)

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

  // Handle Norwegian-specific units
  if (unit === 'båt') {
    // båt = clove (for garlic)
    return convertCountToWeight(amount, ingredientName);
  }

  if (unit === 'pk') {
    // pk = package (for pre-packaged items)
    return convertCountToWeight(amount, ingredientName);
  }

  if (unit === 'potte') {
    // potte = pot (for potted herbs)
    return convertCountToWeight(amount, ingredientName);
  }

  if (unit === 'ml') {
    // ml = milliliters (volume unit)
    return convertVolumeToWeight(amount, ingredientName);
  }

  if (unit === 'l') {
    // l = liters (volume unit)
    return convertVolumeToWeight(amount * 1000, ingredientName);
  }

  if (unit === 'klype') {
    // klype = pinch (very small amount)
    return amount * 0.5; // Approximately 0.5g per pinch
  }

  if (unit === 'knivspiss') {
    // knivspiss = knife tip (very small amount)
    return amount * 0.3; // Approximately 0.3g per knife tip
  }

  // Unknown unit - return amount as-is (assume grams)
  debugLog(`Unknown measurement unit: ${measurement} for ${ingredientName}`);
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

  const unit = recipeMeasurement.toLowerCase();

  // For count-based units (stk, boks, pakke, båt, pk, potte), calculate price directly
  if (unit === 'stk' || unit === 'boks' || unit === 'pakke' || unit === 'båt' || unit === 'pk' || unit === 'potte') {
    // Calculate price per unit, then multiply by recipe amount
    const pricePerUnit = productPrice; // Product price is already per unit
    const totalPrice = recipeAmount * pricePerUnit;
    
    // Debug logging for count-based units
    debugLog(`Count-based pricing for ${ingredientName}: ${recipeAmount} ${unit} × ${pricePerUnit} kr = ${totalPrice} kr`);
    
    return totalPrice;
  }

  // For weight and volume units, convert to grams first
  const recipeWeight = convertToGrams(recipeAmount, recipeMeasurement, ingredientName);
  const pricePerGram = productPrice / productWeight;
  const totalPrice = recipeWeight * pricePerGram;
  
      // Debug logging for weight/volume units
    debugLog(`Weight-based pricing for ${ingredientName}: ${recipeAmount} ${unit} → ${recipeWeight}g × ${pricePerGram.toFixed(4)} kr/g = ${totalPrice} kr`);
  
  return totalPrice;
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

/**
 * Check if a measurement unit is a weight unit
 * @param {string} unit - The measurement unit to check
 * @returns {boolean} - True if it's a weight unit
 */
export function isWeightUnit(unit: string): unit is WeightUnit {
  return MEASUREMENT_UNITS.WEIGHT.includes(unit as WeightUnit);
}

/**
 * Check if a measurement unit is a volume unit
 * @param {string} unit - The measurement unit to check
 * @returns {boolean} - True if it's a volume unit
 */
export function isVolumeUnit(unit: string): unit is VolumeUnit {
  return MEASUREMENT_UNITS.VOLUME.includes(unit as VolumeUnit);
}

/**
 * Check if a measurement unit is a count unit
 * @param {string} unit - The measurement unit to check
 * @returns {boolean} - True if it's a count unit
 */
export function isCountUnit(unit: string): unit is CountUnit {
  return MEASUREMENT_UNITS.COUNT.includes(unit as CountUnit);
}

/**
 * Check if a measurement unit is a small amount unit
 * @param {string} unit - The measurement unit to check
 * @returns {boolean} - True if it's a small amount unit
 */
export function isSmallAmountUnit(unit: string): unit is SmallAmountUnit {
  return MEASUREMENT_UNITS.SMALL_AMOUNTS.includes(unit as SmallAmountUnit);
}

/**
 * Get the category of a measurement unit
 * @param {string} unit - The measurement unit to check
 * @returns {string} - The category name
 */
export function getMeasurementUnitCategory(unit: string): string {
  if (isWeightUnit(unit)) return 'Weight';
  if (isVolumeUnit(unit)) return 'Volume';
  if (isCountUnit(unit)) return 'Count';
  if (isSmallAmountUnit(unit)) return 'Small Amount';
  return 'Unknown';
}

/**
 * Get all measurement units for a specific category
 * @param {string} category - The category name
 * @returns {string[]} - Array of measurement units in that category
 */
export function getMeasurementUnitsByCategory(category: string): string[] {
  switch (category.toLowerCase()) {
    case 'weight':
      return [...MEASUREMENT_UNITS.WEIGHT];
    case 'volume':
      return [...MEASUREMENT_UNITS.VOLUME];
    case 'count':
      return [...MEASUREMENT_UNITS.COUNT];
    case 'small amount':
      return [...MEASUREMENT_UNITS.SMALL_AMOUNTS];
    default:
      return [];
  }
}

/**
 * Get measurement unit information
 * @param {string} unit - The measurement unit
 * @returns {object} - Unit information including name, description, and category
 */
export function getMeasurementUnitInfo(unit: string) {
  return MEASUREMENT_UNIT_INFO[unit as MeasurementUnit] || null;
}

/**
 * Get all measurement units with their information
 * @returns {object} - All measurement units with their details
 */
export function getAllMeasurementUnitsWithInfo() {
  return MEASUREMENT_UNIT_INFO;
}

/**
 * Validate if a measurement unit is supported
 * @param {string} unit - The measurement unit to validate
 * @returns {boolean} - True if the unit is supported
 */
export function isValidMeasurementUnit(unit: string): unit is MeasurementUnit {
  return ALL_MEASUREMENT_UNITS.includes(unit as MeasurementUnit);
}

/**
 * Get measurement units grouped by category for UI display
 * @returns {object} - Measurement units organized by category
 */
export function getMeasurementUnitsGrouped() {
  return {
    'Weight': MEASUREMENT_UNITS.WEIGHT.map(unit => ({
      value: unit,
      label: MEASUREMENT_UNIT_INFO[unit].name,
      description: MEASUREMENT_UNIT_INFO[unit].description
    })),
    'Volume': MEASUREMENT_UNITS.VOLUME.map(unit => ({
      value: unit,
      label: MEASUREMENT_UNIT_INFO[unit].name,
      description: MEASUREMENT_UNIT_INFO[unit].description
    })),
    'Count': MEASUREMENT_UNITS.COUNT.map(unit => ({
      value: unit,
      label: MEASUREMENT_UNIT_INFO[unit].name,
      description: MEASUREMENT_UNIT_INFO[unit].description
    })),
    'Small Amounts': MEASUREMENT_UNITS.SMALL_AMOUNTS.map(unit => ({
      value: unit,
      label: MEASUREMENT_UNIT_INFO[unit].name,
      description: MEASUREMENT_UNIT_INFO[unit].description
    }))
  };
}
