<script lang="ts">
    import FeatureList from "$lib/components/ui/feature-list/FeatureList.svelte";
    import RecipeCarousel from "$lib/components/ui/carousel/RecipeCarousel.svelte";
    import { onMount } from "svelte";
    import { Utensils, Zap, Leaf, Fish } from "lucide-svelte";
    import type { Recipe } from '$lib/types';

    // Retreived from +server.js load function
    export let data;
    $: ({ recipes } = data);

    let isLoaded = false;

    onMount(() => {
        // Small delay to ensure layout calculations are complete
        setTimeout(() => {
            isLoaded = true;
        }, 500);
    });


    // Filter recipes by category
    $: quickRecipes = recipes
        .filter((recipe: Recipe & { estimatedPrice?: number }) => 
            recipe.prepTime && recipe.prepTime > 0 && recipe.prepTime <= 30
        )
        .sort((a: Recipe & { estimatedPrice?: number }, b: Recipe & { estimatedPrice?: number }) => {
            // Sort by prepTime ascending (fastest first)
            const timeA = a.prepTime || 999;
            const timeB = b.prepTime || 999;
            return timeA - timeB;
        });
    $: vegetarianRecipes = recipes.filter((recipe: Recipe & { estimatedPrice?: number }) => {
        if (!recipe.dietaryLabels || recipe.dietaryLabels.length === 0) return false;
        // Check for both vegan and vegetarian labels (Norwegian and English for compatibility)
        return recipe.dietaryLabels.includes('Vegetarisk') || 
               recipe.dietaryLabels.includes('vegetarian') ||
               recipe.dietaryLabels.includes('Vegansk') ||
               recipe.dietaryLabels.includes('vegan');
    });
    $: pescetarianRecipes = recipes.filter((recipe: Recipe & { estimatedPrice?: number }) => {
        if (!recipe.dietaryLabels || recipe.dietaryLabels.length === 0) return false;
        // Check for both Norwegian label and English key for compatibility
        return recipe.dietaryLabels.includes('Pesci') || recipe.dietaryLabels.includes('pescetarian');
    });

    // Used to display the number of meal plans and recipes
    // $: mealPlanCount = data.mealplans.length;
    // $: recipeCount = data.recipes.length;

</script>

<svelte:head>
    <title>God Middag! 🍽️</title>
</svelte:head>


<!-- Loading overlay -->
{#if !isLoaded}
    <div class="fixed inset-0 z-50 flex items-center justify-center loading-overlay">
        <div class="text-2xl font-bold text-gray-600 dark:text-gray-300"><Utensils size="50px"/></div>
    </div>
{/if}
{#if isLoaded}

<section class="dark:bg-gray-900 bg-white relative z-10 pb-16 pt-24 mx-auto">
    <!-- <FeatureList className="pointer-events-none mx-auto"
    title="Go middag! 👋"
    features={[
        `${mealPlanCount} Ukemenyer og ${recipeCount} oppskrifter`,
        "Skreddersy dine egne 'matkasser' med våre oppskrifter og ukemenyer",
        "Få varene på døra med Meny / Oda, eller gå direkte til butikken selv",
    ]}
  /> -->
  <!-- Rask middag Carousel -->
  {#if quickRecipes.length > 0}
    <RecipeCarousel
      id="quick-carousel"
      ariaLabel="Rask middag carousel"
      title="Rask middag"
      subtitle="Sunne og rask middager"
      Icon={Zap}
      iconClass="text-yellow-500 dark:text-yellow-400"
      recipes={quickRecipes}
    />
  {/if}

  <!-- Vegetarian Carousel -->
  {#if vegetarianRecipes.length > 0}
    <RecipeCarousel
      id="vegetarian-carousel"
      ariaLabel="Kjøttfritt carousel"
      title="Kjøttfritt"
      subtitle="Godt for deg og miljøet"
      Icon={Leaf}
      iconClass="text-green-500 dark:text-green-400"
      recipes={vegetarianRecipes}
    />
  {/if}

  <!-- Pescetarian Carousel -->
  {#if pescetarianRecipes.length > 0}
    <RecipeCarousel
      id="pescetarian-carousel"
      ariaLabel="Fisk til middag carousel"
      title="Fisk"
      subtitle="Pescitarianske middager"
      Icon={Fish}
      iconClass="text-blue-500 dark:text-blue-400"
      recipes={pescetarianRecipes}
    />
  {/if}
</section>
{/if}

<style>
    section {
        position: relative;
        z-index: 10;
        min-height: 100vh;
        background: transparent;
    }
</style>
