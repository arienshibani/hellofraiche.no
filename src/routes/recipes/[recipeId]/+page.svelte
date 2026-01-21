<script lang="ts">
    import { debugLog } from '$lib/util/logger';
    import {
        PlusCircle,
        MinusCircle,
    } from "svelte-heros-v2";
    import { goto } from "$app/navigation";
    import { formatAmount } from "$lib/util/formatAmount.js";
    import { calculateIngredientPrice } from "$lib/util/conversions";
    import IngredientsTable from "$lib/components/ui/IngredientsTable.svelte";
    import NutritionTable from "$lib/components/ui/NutritionTable.svelte";
    import { Alert } from "flowbite-svelte";
    import { Info, AlertTriangle, Lightbulb, Clock } from "lucide-svelte";
    import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
    import type { RecipePageData, RecipeTip, RecipeIngredient, IngredientWithPrice } from "$lib/types";
    import { getLabelConfig, getLabelColorClasses } from '$lib/util/dietaryLabels';

    // Load data from +page.server.ts
    $: ({ recipe, mealPlan, ingredients } = data);

    export let data: RecipePageData;

    // Portion counter - must be declared before reactive statements that use it
    let count =  data?.recipe?.portions || 1;
    // Get the base portion size for this recipe
    const basePortions = data?.recipe?.portions || 1;

    debugLog(data.ingredients);

    // Helper function to get tips for a specific step
    const getTipsForStep = (stepNumber: number): RecipeTip[] => {
        if (!recipe.tips || !Array.isArray(recipe.tips)) return [];
        return recipe.tips.filter((tip: RecipeTip) => tip.associatedWithStepNr === stepNumber);
    };

    // Helper function to get the appropriate icon and color for tip type
    const getTipConfig = (type: "caution" | "info" | "tip"): {
        icon: typeof AlertTriangle | typeof Info | typeof Lightbulb;
        color: 'yellow' | 'blue' | 'green';
        iconClass: string;
    } => {
        switch(type) {
            case 'caution':
                return {
                    icon: AlertTriangle,
                    color: 'yellow' as const,
                    iconClass: 'text-yellow-600 dark:text-yellow-400'
                };
            case 'info':
                return {
                    icon: Info,
                    color: 'blue' as const,
                    iconClass: 'text-blue-600 dark:text-blue-400'
                };
            case 'tip':
            default:
                return {
                    icon: Lightbulb,
                    color: 'green' as const,
                    iconClass: 'text-green-600 dark:text-green-400'
                };
        }
    };

    // Calculate total recipe price using accurate conversions
    $: totalRecipePrice = recipe.recipeIngredients
        .map((ingredient: RecipeIngredient): number | null => {
            const ingredientData = ingredients.find((ing: IngredientWithPrice) => ing.name === ingredient.name);
            // The API response is nested: data.data.products (not data.products)
            const products = ingredientData?.data?.data?.products || ingredientData?.data?.products;
            if (!ingredientData || !ingredientData.data || !products) return null;

            const menyProduct = products.find((product) =>
                product?.store?.name === 'Meny'
            );

            if (!menyProduct?.current_price?.price) return null;

            // Calculate the correct scaling factor
            // ingredient.amount is already for basePortions, so we scale by (count / basePortions)
            const scalingFactor = count / basePortions;
            const scaledAmount = ingredient.amount * scalingFactor;

            // Use accurate price calculation based on weight
            const productWeight = menyProduct.weight || 100; // Default to 100g if no weight data
            return calculateIngredientPrice(
                scaledAmount,
                ingredient.measurement,
                ingredient.name,
                menyProduct.current_price.price,
                productWeight
            );
        })
        .filter((price: number | null): price is number => price !== null)
        .reduce((sum: number, price: number) => sum + price, 0);

    // Do not allow the counter to go above 10
    const handlePlus = () => {
        count += 1;
        if (count >= 10) {
            count = 10;
        }
    };

    // Do not allow the counter to go below 1
    const handleMinus = () => {
        count -= 1;
        if (count <= 1) {
            count = 1;
        }
    };

    const currentRecipeId = data.recipe.recipeId;
    const currentIndex = mealPlan?.recipes.findIndex(
        (el: { recipeId: string }) => el.recipeId === currentRecipeId,
    ) ?? -1;

    const weekDaysMap = {
        0: "Man",
        1: "Tir",
        2: "Tor",
        3: "Ons",
    };

    const handleNextRecipe = () => {
        if (!mealPlan || !mealPlan.recipes || mealPlan.recipes.length === 0) return;
        
        if (currentIndex === 3) {
            goto(`/recipes/${mealPlan.recipes[0].recipeId}`);
        } else if (currentIndex >= 0 && currentIndex < mealPlan.recipes.length - 1) {
            goto(
                `/recipes/${mealPlan.recipes[currentIndex + 1].recipeId}`,
            );
        }
    };

    const handlePreviousRecipe = () => {
        if (!mealPlan || !mealPlan.recipes || mealPlan.recipes.length === 0) return;
        
        // Use the above information to figure out current index in mealPlan.recipes
        let currentIndex = mealPlan.recipes.findIndex(
            (el: { recipeId: string }) => el.recipeId === currentRecipeId,
        );

        if (currentIndex === 0) {
            const lastIndex = mealPlan.recipes.length - 1;
            goto(`/recipes/${mealPlan.recipes[lastIndex].recipeId}`);
        } else if (currentIndex > 0) {
            goto(
                `/recipes/${mealPlan.recipes[currentIndex - 1].recipeId}`,
            );
        }
    };

    const goToMealPlan = () => {
        goto(`/plans/${data.recipe.mealPlanId}`);
    };


</script>

<svelte:head>
    <title>{recipe.title} {recipe.subtitle ? ` ${recipe.subtitle}` : ''} | HalloFraiche</title>
</svelte:head>

<main>
  <div class="dark:bg-gray-900">
    <div class="mb-4 pt-8 px-4">
      <Breadcrumb 
        items={[
          { label: 'Hjem', href: '/' },
          { label: 'Oppskrifter', href: '/recipes' },
          { label: recipe.title }
        ]} 
      />
    </div>
        <h1 class="text-4xl text-center pb-5 pt-36 font-extrabold dark:text-white">{recipe.title}</h1>
        <h1 class="text-2xl text-center smallerTextOnSmallScreens dark:text-gray-300">
            {recipe.subtitle}
        </h1>

        <!-- Dietary Labels -->
        {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
            <div class="flex flex-wrap justify-center gap-2 mt-4 mb-4">
                {#each recipe.dietaryLabels as label}
                    {@const config = getLabelConfig(label)}
                    {@const Icon = config?.icon}
                    <span
                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium {getLabelColorClasses(label, true)}"
                    >
                        {#if Icon}
                            <Icon size={16} />
                        {/if}
                        <span>{label}</span>
                    </span>
                {/each}
            </div>
        {/if}

        <!-- Prep Time Display -->
        {#if recipe.prepTime && recipe.prepTime > 0}
          <div class="mt-4 mb-4 flex items-center justify-center gap-2 text-base text-gray-600 dark:text-gray-400">
            <Clock size={18} class="text-gray-500 dark:text-gray-400" />
            <span class="font-medium">{recipe.prepTime} min</span>
          </div>
        {/if}

        <!-- Recipe Image - Optional, rendered if recipeImage exists -->
        {#if recipe.recipeImage}
            <div class="flex justify-center mt-8 mb-8">
                <img 
                    src={recipe.recipeImage} 
                    alt={`${recipe.title}${recipe.subtitle ? ` - ${recipe.subtitle}` : ''}`}
                    class="max-w-2xl w-full rounded-lg shadow-lg object-cover"
                />
            </div>
        {/if}

        <div class="flex justify-center flex-wrap mt-16 pb-40 dark:bg-gray-900 dark:text-white">
            <div class="p-4 rounded max-w-2xl w-full">
                                <h1 class="text-2xl font-extrabold dark:text-white mb-6 text-center">Ingredienser</h1>

                <!-- Person Counter -->
                <div class="flex justify-center mb-6">
                    <button on:click={handleMinus} class="pr-5">
                        <MinusCircle class="inline" />
                    </button>
                    <h2 class="text-1xl text-gray-900 dark:text-white">
                        {count}
                        <span class="inline-block w-20 text-left">
                            {count === 1 ? "Person" : "Personer"}
                        </span>
                    </h2>
                    <button on:click={handlePlus} class="pl-5">
                        <PlusCircle class="inline" />
                    </button>
                </div>

                <!-- Ingredients Table -->
                <IngredientsTable
                    {ingredients}
                    recipeIngredients={recipe.recipeIngredients}
                    {count}
                    {totalRecipePrice}
                    basePortions={basePortions}
                />
            </div>

            <div class="flex-grow-1  p-4 rounded">
                <h1 class="text-2xl font-bold pb-5 topPaddingOnSmallScreens dark:text-white">
                    Fremgangsmåte
                </h1>
                {#each recipe.steps as cookingInstruction, index}
                    {@const stepNumber = index + 1}
                    {@const stepTips = getTipsForStep(stepNumber)}
                    <div class="mb-4">
                        <p class="text-xl p-4 max-w-lg dark:text-gray-200">
                            <span class="font-bold">{stepNumber}.</span>
                            {cookingInstruction}
                        </p>
                        
                        <!-- Tips for this step using Flowbite Alert component -->
                        {#if stepTips.length > 0}
                            <div class="ml-4 mr-4 mb-4 space-y-2 max-w-lg">
                                {#each stepTips as tip}
                                    {@const tipConfig = getTipConfig(tip.type)}
                                    {@const IconComponent = tipConfig.icon}
                                    <Alert color={tipConfig.color} class="flex items-start gap-2">
                                        <IconComponent size={20} class={tipConfig.iconClass} />
                                        <span class="text-sm">{tip.tipText}</span>
                                    </Alert>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Nutrition Table - Outside the flex container for proper centering -->
        <div class="flex justify-center pb-40">
            <NutritionTable
                {ingredients}
                recipeIngredients={recipe.recipeIngredients}
                {count}
                basePortions={basePortions}
            />
        </div>
    </div>
</main>
<style>


    @media (max-width: 881px) {
        .smallerTextOnSmallScreens {
            font-size: 1rem !important;
        }
    }
</style>
