<script>
    // @ts-nocheck
    import {
        PlusCircle,
        MinusCircle,
        ArrowLeftCircle,
        ArrowRightCircle,
        ArrowDownCircle,
    } from "svelte-heros-v2";
    import { goto } from "$app/navigation";
    import { formatAmount } from "$lib/util/formatAmount.js";

    // Load data from +page.server.js
    $: ({ recipe, mealPlan, ingredients } = data);
    export let data;

    console.log(data)

    // Function to find Meny product for an ingredient
    function findMenyProduct(ingredientName) {
        const ingredient = ingredients.find(ing => ing.name === ingredientName);
        if (!ingredient || !ingredient.data || !ingredient.data.products) return null;

        // Find Meny product
        return ingredient.data.products.find(product =>
            product.store && product.store.name === 'Meny'
        ) || null;
    }

    // Calculate ingredient price based on amount and Meny product
    function calculateIngredientPrice(recipeIngredient) {
        const menyProduct = findMenyProduct(recipeIngredient.name);
        if (!menyProduct || !menyProduct.current_price || !menyProduct.current_price.price) {
            return null;
        }

        const basePrice = menyProduct.current_price.price;
        const baseAmount = recipeIngredient.amount;

        // For now, we'll use the base price as-is
        // #TODO: In the future, we could implement more sophisticated price calculations
        // based on weight/volume units
        return basePrice;
    }

    // Calculate total recipe price
    $: totalRecipePrice = recipe.recipeIngredients
        .map(ingredient => calculateIngredientPrice(ingredient))
        .filter(price => price !== null)
        .reduce((sum, price) => sum + price, 0);

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
    const currentIndex = data.mealPlan.recipes.findIndex(
        (el) => el.recipeId === currentRecipeId,
    );

    const weekDaysMap = {
        0: "Man",
        1: "Tir",
        2: "Tor",
        3: "Ons",
    };

    const handleNextRecipe = () => {
        if (currentIndex === 3) {
            goto(`/recipes/${data.mealPlan.recipes[0].recipeId}`);
        } else {
            goto(
                `/recipes/${data.mealPlan.recipes[currentIndex + 1].recipeId}`,
            );
        }
    };

    const handlePreviousRecipe = () => {
        // Use the above information to figure out current index in data.mealPlan.recipes
        let currentIndex = data.mealPlan.recipes.findIndex(
            (el) => el.recipeId === currentRecipeId,
        );

        if (currentIndex === 0) {
            goto(`/recipes/${data.mealPlan.recipes[3].recipeId}`);
        } else {
            goto(
                `/recipes/${data.mealPlan.recipes[currentIndex - 1].recipeId}`,
            );
        }
    };

    let count = 1;

    const goToMealPlan = () => {
        goto(`/plans/${data.recipe.mealPlanId}`);
    };
</script>
<svelte:head>
    <title>{recipe.title} {recipe.subtitle ? ` – ${recipe.subtitle}` : ''} | HalloFraiche</title>
</svelte:head>

<main>
    <div class="dark:bg-gray-900">
        <h1 class="text-4xl text-center pb-5 pt-36 font-extrabold dark:text-white">{recipe.title}</h1>
        <h1 class="text-2xl text-center hideOnSmallScreens smallerTextOnSmallScreens dark:text-gray-300">
            {recipe.subtitle}
        </h1>

        <div class="flex justify-center flex-wrap mt-16 pb-40 dark:bg-gray-900 dark:text-white">
            <div class=" p-4 rounded">
                <h1 class="text-2xl font-extrabold dark:text-white">Ingredienser</h1>

                <!-- Total Price Display -->
                {#if totalRecipePrice > 0}
                    <div class="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-4 mb-6">
                        <div class="flex items-center justify-between">
                            <span class="text-lg font-semibold text-green-800 dark:text-green-200">
                                Total pris hos Meny:
                            </span>
                            <span class="text-2xl font-bold text-green-800 dark:text-green-200">
                                {totalRecipePrice.toFixed(2)} kr
                            </span>
                        </div>
                        <p class="text-sm text-green-600 dark:text-green-300 mt-1">
                            Alle ingredienser kan leveres hjem til deg
                        </p>
                    </div>
                {/if}

                <div class="flex justify-start pt-5">
                    <button on:click={handleMinus} class="pr-5">
                        <MinusCircle class="inline" />
                    </button>
                    <h2 class="text-1xl text-gray-900 dark:text-white">
                        {count}
                        {count === 1 ? "Person  " : "Personer"}
                    </h2>
                    <button on:click={handlePlus} class="pl-5">
                        <PlusCircle class="inline" />
                    </button>
                </div>

                {#each recipe.recipeIngredients as ingredient}
                    {@const ingredientPrice = calculateIngredientPrice(ingredient)}
                    {@const menyProduct = findMenyProduct(ingredient.name)}
                    <div class="pt-6 text-lg bigPaddingOnLargeScreens dark:text-gray-200 flex items-center justify-between">
                        <div class="flex-1">
                            {formatAmount(ingredient.amount * count, ingredient.measurement)}
                            <span class="pl-4 text-left">{ingredient.name}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            {#if ingredientPrice}
                                <span class="text-green-600 dark:text-green-400 font-semibold text-right min-w-[80px]">
                                    {ingredientPrice.toFixed(2)} kr
                                </span>
                                {#if menyProduct && menyProduct.url}
                                    <a 
                                        href={menyProduct.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                        title="Kjøp hos Meny"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                {/if}
                            {:else}
                                <span class="text-gray-400 dark:text-gray-500 text-right min-w-[80px]">
                                    N/A
                                </span>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="flex-grow-1  p-4 rounded">
                <h1 class="text-2xl font-bold pb-5 topPaddingOnSmallScreens dark:text-white">
                    Fremgangsmåte
                </h1>
                {#each recipe.steps as cookingInstruction, index}
                    <p class="text-xl p-4 max-w-lg dark:text-gray-200">
                        <span class="font-bold">{index + 1 + "."}</span>
                        {cookingInstruction}
                    </p>
                {/each}
            </div>
        </div>
    </div>
</main>
<style>
    .bigPaddingOnLargeScreens {
        padding-right: 10rem;
    }

    @media (max-width: 881px) {
        .smallerTextOnSmallScreens {
            font-size: 1rem !important;
        }

        .hideOnSmallScreens {
            display: none;
        }

        .bigPaddingOnLargeScreens {
            padding-right: 0rem;
        }

        .topPaddingOnSmallScreens {
            padding: 2rem;
            padding-top: 4rem;
        }
    }
</style>
