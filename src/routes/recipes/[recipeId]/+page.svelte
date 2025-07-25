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
    import { calculateIngredientPrice } from "$lib/util/conversions";
    import IngredientsTable from "$lib/components/ui/IngredientsTable.svelte";
    import NutritionTable from "$lib/components/ui/NutritionTable.svelte";



    // Load data from +page.server.js
    $: ({ recipe, mealPlan, ingredients } = data);

    export let data;
    
    // Portion counter - must be declared before reactive statements that use it
    let count = 1;
    
    // Calculate total recipe price using accurate conversions
    $: totalRecipePrice = recipe.recipeIngredients
        .map(ingredient => {
            const ingredientData = ingredients.find(ing => ing.name === ingredient.name);
            if (!ingredientData || !ingredientData.data || !ingredientData.data.products) return null;

            const menyProduct = ingredientData.data.products.find(product =>
                product.store && product.store.name === 'Meny'
            );

            if (!menyProduct?.current_price?.price) return null;

            // Use accurate price calculation based on weight
            const productWeight = menyProduct.weight || 100; // Default to 100g if no weight data
            return calculateIngredientPrice(
                ingredient.amount * count,
                ingredient.measurement,
                ingredient.name,
                menyProduct.current_price.price,
                productWeight
            );
        })
        .filter(price => price !== null)
        .reduce((sum, price) => sum + (price || 0), 0);

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

    const goToMealPlan = () => {
        goto(`/plans/${data.recipe.mealPlanId}`);
    };
    console.log(data, "HAHAH")

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
            <div class="p-4 rounded max-w-2xl w-full">
                                <h1 class="text-2xl font-extrabold dark:text-white mb-6 text-center">Ingredienser</h1>

                <!-- Person Counter -->
                <div class="flex justify-center mb-6">
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

                <!-- Ingredients Table -->
                <IngredientsTable
                    {ingredients}
                    recipeIngredients={recipe.recipeIngredients}
                    {count}
                    {totalRecipePrice}
                />
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

        <!-- Nutrition Table - Outside the flex container for proper centering -->
        <div class="flex justify-center pb-40">
            <NutritionTable
                {ingredients}
                recipeIngredients={recipe.recipeIngredients}
                {count}
            />
        </div>
    </div>
</main>
<style>


    @media (max-width: 881px) {
        .smallerTextOnSmallScreens {
            font-size: 1rem !important;
        }

        .hideOnSmallScreens {
            display: none;
        }
    }
</style>
