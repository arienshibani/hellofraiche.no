export type DishIngredient = {
    name: string; // Name of ingredient.
    amount: number; // The amount used.
    measurement: string; // The measurement used for the amount.
};

export type Dish = {
    dish: string; // Title of the dish.
    subtitle: string; // Subtitle of the dish
    dishIngredients: DishIngredient[]; // List of ingredients in the dish.
    prepTime: number; // Number of estimated minutes it takes to prepare the dish.
    portions: number; // Portion size for the dish
    steps: string[]; // Steps that must be followed for preparation
    mealPlanId: string; // Unique identifier used to find out what meal plan this dish is a part of.
};

// Database ingredient with price data from Kassal.app
export type IngredientWithPrice = {
    _id: string;
    name: string;
    ean: string;
    data?: {
        products?: Array<{
            store?: {
                name: string;
            };
            current_price?: {
                price: number;
            };
            url?: string;
            weight?: number;
            weight_unit?: string;
            nutrition?: Array<{
                code: string;
                display_name: string;
                amount: number;
                unit: string;
            }>;
        }>;
        nutrition?: Array<{
            code: string;
            display_name: string;
            amount: number;
            unit: string;
        }>;
    };
};

// Recipe ingredient (from recipe data)
export type RecipeIngredient = {
    name: string;
    amount: number;
    measurement: string;
    isBulkItem?: boolean;
};

// Recipe tip type
export type RecipeTip = {
    type: "caution" | "info" | "tip";
    tipText: string;
    associatedWithStepNr: number;
};

// Recipe type (matches the actual structure used in the codebase)
export type Recipe = {
    _id?: string; // MongoDB document ID
    title: string; // Title of the recipe
    subtitle?: string; // Optional subtitle
    prepTime?: number; // Number of estimated minutes it takes to prepare
    portions: number; // Portion size for the recipe
    recipeImage?: string; // Optional image path or URL
    steps: string[]; // Steps that must be followed for preparation
    tips?: RecipeTip[]; // Optional tips array
    recipeIngredients: RecipeIngredient[]; // List of ingredients in the recipe
    recipeId: string; // Unique identifier for the recipe
    mealPlanId?: string; // Optional identifier for the meal plan this recipe belongs to
    utkast?: boolean; // Draft mode - if true, recipe is not shown on public pages (default: true for new recipes)
};

// MealPlan recipe reference (used in mealPlan.recipes array)
export type MealPlanRecipe = {
    recipeId: string;
    title?: string; // Optional, may not be included in projection
};

// MealPlan type (matches the structure returned from database)
export type MealPlan = {
    _id?: string; // MongoDB document ID
    name: string; // Name of the meal plan
    recipes: MealPlanRecipe[]; // Array of recipe references
    mealPlanId?: string; // Optional unique identifier
    estimatedPrice?: number; // Optional estimated price (added during processing)
};

// PageData type for recipe detail page
export type RecipePageData = {
    recipe: Recipe;
    mealPlan: MealPlan | null;
    ingredients: IngredientWithPrice[];
};