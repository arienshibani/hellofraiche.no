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
    import WinePairing from "$lib/components/ui/WinePairing.svelte";
    import { Alert } from "flowbite-svelte";
    import { Info, AlertTriangle, Lightbulb, Clock } from "lucide-svelte";
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

    // Build a lookup map from ingredient emoji to scaled amount label for the current portion count
    const buildEmojiAmountMap = (
        recipeIngredients: RecipeIngredient[],
        countPortions: number,
        basePortionsValue: number,
    ): Record<string, string> => {
        if (!Array.isArray(recipeIngredients) || recipeIngredients.length === 0) {
            return {};
        }

        const emojiToAmount: Record<string, string> = {};
        const scalingFactor = basePortionsValue > 0 ? countPortions / basePortionsValue : 1;

        const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/gu;

        for (const ingredient of recipeIngredients) {
            if (!ingredient?.name || ingredient.amount == null) continue;

            let lastEmoji: string | null = null;
            let match: RegExpExecArray | null;

            while ((match = emojiRegex.exec(ingredient.name)) !== null) {
                lastEmoji = match[0];
            }

            if (!lastEmoji) continue;

            const scaledAmount = ingredient.amount * scalingFactor;
            const label = formatAmount(scaledAmount, ingredient.measurement || "");

            emojiToAmount[lastEmoji] = label;
        }

        return emojiToAmount;
    };

    // Reactive emoji→amount map for the current portion selection
    $: emojiAmountMap = buildEmojiAmountMap(recipe.recipeIngredients, count, basePortions);

    // Inject dynamic amounts into step text based on ingredient emojis
    const formatStepWithAmounts = (
        step: string,
        emojiToAmount: Record<string, string>,
    ): string => {
        if (!step || !emojiToAmount || Object.keys(emojiToAmount).length === 0) {
            return step;
        }

        let result = step;

        for (const [emoji, amountLabel] of Object.entries(emojiToAmount)) {
            if (!emoji || !amountLabel) continue;

            const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = new RegExp(`(${escapedEmoji})(?!\\s*\\()`, "g");

            result = result.replace(pattern, `$1 (${amountLabel})`);
        }

        return result;
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

    // const handleNextRecipe = () => {
    //     if (!mealPlan || !mealPlan.recipes || mealPlan.recipes.length === 0) return;
        
    //     if (currentIndex === 3) {
    //         goto(`/recipes/${mealPlan.recipes[0].recipeId}`);
    //     } else if (currentIndex >= 0 && currentIndex < mealPlan.recipes.length - 1) {
    //         goto(
    //             `/recipes/${mealPlan.recipes[currentIndex + 1].recipeId}`,
    //         );
    //     }
    // };

    // const handlePreviousRecipe = () => {
    //     if (!mealPlan || !mealPlan.recipes || mealPlan.recipes.length === 0) return;
        
    //     // Use the above information to figure out current index in mealPlan.recipes
    //     let currentIndex = mealPlan.recipes.findIndex(
    //         (el: { recipeId: string }) => el.recipeId === currentRecipeId,
    //     );

    //     if (currentIndex === 0) {
    //         const lastIndex = mealPlan.recipes.length - 1;
    //         goto(`/recipes/${mealPlan.recipes[lastIndex].recipeId}`);
    //     } else if (currentIndex > 0) {
    //         goto(
    //             `/recipes/${mealPlan.recipes[currentIndex - 1].recipeId}`,
    //         );
    //     }
    // };

    // const goToMealPlan = () => {
    //     goto(`/plans/${data.recipe.mealPlanId}`);
    // };
</script>

<svelte:head>
    <title>{recipe.title} {recipe.subtitle ? ` ${recipe.subtitle}` : ''} | HalloFraiche</title>
</svelte:head>

<main>
  <div class="dark:bg-gray-900">
        <!-- Recipe Image - above title, subtitle and icons -->
        {#if recipe.recipeImage}
            <div class="flex justify-center pt-36 pb-6">
                <img 
                    src={recipe.recipeImage} 
                    alt={`${recipe.title}${recipe.subtitle ? ` - ${recipe.subtitle}` : ''}`}
                    class="max-w-2xl w-full rounded-lg shadow-lg object-cover"
                />
            </div>
        {/if}

        <h1 class="text-4xl text-center pb-5 font-extrabold dark:text-white {recipe.recipeImage ? 'pt-8' : 'pt-36'}">{recipe.title}</h1>
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

        <div class="flex justify-center mt-16 pb-40 dark:bg-gray-900 dark:text-white">
            <div class="w-full max-w-6xl flex flex-col gap-10 lg:flex-row lg:items-start px-4 sm:px-6">
                <!-- Ingredients column (approx 1/3 on large screens) -->
                <div class="w-full lg:w-1/3">
                    <div class="rounded-2xl border border-gray-100 bg-white/95 px-4 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                        <h1 class="text-2xl font-extrabold dark:text-white mb-4 text-center italic">
                            Ingredienser
                        </h1>

                        <!-- Person Counter -->
                        <div class="flex items-center justify-center mb-4">
                            <div class="flex items-center justify-center gap-1">
                                <button on:click={handleMinus} class="text-gray-700 dark:text-gray-200">
                                    <MinusCircle class="inline" />
                                </button>
                                <h2 class="text-base text-gray-900 dark:text-white">
                                    {count}
                                    <span class="inline-block w-20 text-left">
                                        {count === 1 ? "person" : "personer"}
                                    </span>
                                </h2>
                                <button on:click={handlePlus} class="text-gray-700 dark:text-gray-200">
                                    <PlusCircle class="inline" />
                                </button>
                            </div>
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
                </div>

                <!-- Steps column (approx 2/3 on large screens) -->
                <div class="w-full lg:w-2/3 mt-6 lg:mt-0 lg:pl-4 rounded">

                    <div class="space-y-4 sm:space-y-5 max-w-xl">
                        {#each recipe.steps as cookingInstruction, index}
                            {@const stepNumber = index + 1}
                            {@const stepTips = getTipsForStep(stepNumber)}
                            <section
                                class="rounded-2xl border border-gray-100 bg-white/95 px-4 py-3 sm:px-5 sm:py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/80"
                            >
                                <div class="flex items-start gap-3">
                                    <span
                                        class="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900"
                                    >
                                        {stepNumber}
                                    </span>
                                    <p class="text-base sm:text-lg leading-relaxed text-gray-800 dark:text-gray-100">
                                        {formatStepWithAmounts(cookingInstruction, emojiAmountMap)}
                                    </p>
                                </div>

                                <!-- Tips for this step using Flowbite Alert component -->
                                {#if stepTips.length > 0}
                                    <div class="mt-3 space-y-2 pl-10">
                                        {#each stepTips as tip}
                                            {@const tipConfig = getTipConfig(tip.type)}
                                            {@const IconComponent = tipConfig.icon}
                                            <Alert
                                                color={tipConfig.color}
                                                class="flex items-start gap-2 text-sm leading-relaxed"
                                            >
                                                <IconComponent size={18} class={tipConfig.iconClass} />
                                                <span>{tip.tipText}</span>
                                            </Alert>
                                        {/each}
                                    </div>
                                {/if}
                            </section>
                        {/each}
                    </div>
                    <!-- Wine pairing suggestion directly after the last step, matching step width -->
                    <div class="mt-8 max-w-xl">
                        <WinePairing winePairing={recipe.winePairing} compact={true} />
                    </div>
                </div>
            </div>
        </div>

        <!-- Nutrition Table - Outside the flex container for proper centering -->
        <div class="flex justify-center pb-8 sm:pb-12">
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
