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

    // Load data from +page.server.js
    $: ({ recipe, mealPlan } = data);
    export let data;

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

<h1 class="text-4xl text-center pb-5 pt-10 font-extrabold">{recipe.title}</h1>
<h1 class="text-2xl text-center hideOnSmallScreens smallerTextOnSmallScreens">
    {recipe.subtitle}
</h1>

<div class="flex justify-center flex-wrap mt-16 pb-40">
    <div class="">
        <h1 class="text-2xl font-extrabold">Ingredienser</h1>
        <div class="flex justify-start pt-5">
            <button on:click={handleMinus} class="pr-5">
                <MinusCircle class="inline" />
            </button>
            <h2 class="text-1xl text-gray-900">
                {count}
                {count === 1 ? "Person  " : "Personer"}
            </h2>
            <button on:click={handlePlus} class="pl-5">
                <PlusCircle class="inline" />
            </button>
        </div>

        {#each recipe.recipeIngredients as ingredient}
            <p class="pt-6 text-lg bigPaddingOnLargeScreens">
                {ingredient.amount * count}{ingredient.measurement}
                <span class="pl-4 text-left">{ingredient.name}</span>
            </p>
        {/each}
    </div>

    <div class="flex-grow-1">
        <h1 class="text-2xl font-bold pb-5 topPaddingOnSmallScreens">
            Fremgangsmåte
        </h1>
        {#each recipe.steps as cookingInstruction, index}
            <p class="text-xl p-4 max-w-lg">
                <span class="font-bold">{index + 1 + "."}</span>
                {cookingInstruction}
            </p>
        {/each}
    </div>
</div>

<style>
    .bigPaddingOnLargeScreens {
        padding-right: 10rem;
    }

    @media (max-width: 881px) {
        .hideOnLargeScreens {
            display: inherit;
        }
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
