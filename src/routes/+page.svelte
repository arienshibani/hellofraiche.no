<script lang="ts">
    import FeatureList from "$lib/components/ui/feature-list/FeatureList.svelte";
    import RecipeCarousel from "$lib/components/ui/carousel/RecipeCarousel.svelte";
    import ShinyText from "$lib/components/ui/shiny-text/ShinyText.svelte";
    import { goto } from "$app/navigation";
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

    let homeSearch = "";
    let isHomeSearchLoading = false;

    const handleHomeSearchSubmit = async (event: Event) => {
        event.preventDefault();
        if (isHomeSearchLoading) return;
        const trimmedSearch = homeSearch.trim();
        const params = new URLSearchParams();
        if (trimmedSearch) params.set("search", trimmedSearch);
        const queryString = params.toString();
        isHomeSearchLoading = true;
        try {
            await goto(`/recipes${queryString ? `?${queryString}` : ""}`);
        } finally {
            isHomeSearchLoading = false;
        }
    };

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
  <div class="px-4 sm:px-6 lg:px-8 mb-8 text-center">
    <ShinyText
      text="✨ Matkasse uten mellomledd "
      className="text-2xl sm:text-3xl font-semibold"
    />

    <p class="text-gray-600 dark:text-gray-400 text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
      Kjøpt alt du trenger direkte fra dagligvare butikken din på 1-2-3! 
    </p>

    <form class="mt-6 max-w-2xl mx-auto" on:submit={handleHomeSearchSubmit}>
      <label for="home-search" class="sr-only">Søk etter oppskrift</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <input
          id="home-search"
          type="text"
          bind:value={homeSearch}
          placeholder="Søk etter oppskrift, ingrediens, etc..."
          class="bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-full focus:ring-gray-500 focus:border-gray-500 block w-full pl-10 pr-28 p-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500"
        />
        <button
          type="submit"
          class="absolute inset-y-0 right-0 px-4 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-r-full dark:bg-gray-900 flex items-center gap-2 disabled:opacity-70"
          disabled={isHomeSearchLoading}
        >
          {#if isHomeSearchLoading}
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 100 101" fill="none" aria-hidden="true">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" opacity="0.3"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367006 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
            </svg>
          {:else}
            Søk
          {/if}
        </button>
      </div>
    </form>
  </div>

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
