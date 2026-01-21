<script lang="ts">
    import { goto } from "$app/navigation";
    import FeatureList from "$lib/components/ui/feature-list/FeatureList.svelte";
    import { onMount } from "svelte";
    import { Utensils, CookingPot, Clock, Users, PiggyBank, Zap, Leaf, Fish } from "lucide-svelte";
    import { getLabelConfig, getLabelColorClasses } from '$lib/util/dietaryLabels';
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

    const recipeCount = data?.recipes?.length || 0;
    const mealPlanCount = data?.mealplans?.length || 0;

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

    // Drag-to-scroll functionality
    let isDragging = false;
    let hasDragged = false;
    let startX = 0;
    let scrollLeft = 0;
    let draggedElement: HTMLElement | null = null;

    function handleMouseDown(e: MouseEvent, element: HTMLElement) {
        // Don't start dragging if clicking directly on a link or button
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        hasDragged = false;
        draggedElement = element;
        const rect = element.getBoundingClientRect();
        startX = e.clientX - rect.left;
        scrollLeft = element.scrollLeft;
        element.style.cursor = 'grabbing';
        element.style.userSelect = 'none';
        
        // Add global mouse move and up handlers
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
    }

    function handleGlobalMouseMove(e: MouseEvent) {
        if (!isDragging || !draggedElement) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = draggedElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const walk = x - startX; // 1:1 movement ratio
        draggedElement.scrollLeft = scrollLeft - walk;
        hasDragged = true; // Mark that we've actually dragged
    }

    function handleGlobalMouseUp() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        }
        if (draggedElement) {
            draggedElement.style.cursor = 'grab';
            draggedElement.style.userSelect = '';
        }
        isDragging = false;
        draggedElement = null;
        // Reset hasDragged after a short delay to allow click handlers to check it
        setTimeout(() => {
            hasDragged = false;
        }, 50);
    }

    function handleMouseLeave() {
        if (draggedElement) {
            draggedElement.style.cursor = 'grab';
            draggedElement.style.userSelect = '';
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        }
        isDragging = false;
        draggedElement = null;
        setTimeout(() => {
            hasDragged = false;
        }, 50);
    }

    // Touch events for mobile
    let touchStartX = 0;
    let touchScrollLeft = 0;
    let touchDraggedElement: HTMLElement | null = null;
    let touchHasDragged = false;

    function handleTouchStart(e: TouchEvent, element: HTMLElement) {
        touchDraggedElement = element;
        const rect = element.getBoundingClientRect();
        touchStartX = e.touches[0].clientX - rect.left;
        touchScrollLeft = element.scrollLeft;
        touchHasDragged = false;
    }

    function handleTouchMove(e: TouchEvent) {
        if (!touchDraggedElement) return;
        const rect = touchDraggedElement.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const walk = x - touchStartX; // 1:1 movement ratio
        touchDraggedElement.scrollLeft = touchScrollLeft - walk;
        touchHasDragged = true;
    }

    function handleTouchEnd() {
        const wasDragging = touchHasDragged;
        touchDraggedElement = null;
        setTimeout(() => {
            touchHasDragged = false;
        }, 50);
    }
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
    <FeatureList className="pointer-events-none mx-auto"
    title="Go middag! 👋"
    features={[
        //`${mealPlanCount} Ukemenyer og ${recipeCount} oppskrifter`,
        "Sjekk hva det faktisk koster å lage maten med vår live prisoversikt",
        "Søk etter oppskrifter, ingredienser eller ukemenyer og finn noe som passer",
        "Bestill ukemenyen direkte fra Meny / Oda, ingen dyre mellomledd her"
    ]}
  />
  <!-- Rask middag Carousel -->
  {#if quickRecipes.length > 0}
    <div class="mb-12">
      <div class="mb-4 px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap size={28} class="text-yellow-500 dark:text-yellow-400" />
          Rask middag
        </h2>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div 
        id="quick-carousel"
        role="region"
        aria-label="Rask middag carousel"
        class="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 cursor-grab active:cursor-grabbing"
        style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;"
        on:mousedown={(e) => handleMouseDown(e, e.currentTarget)}
        on:mouseleave={handleMouseLeave}
        on:touchstart={(e) => handleTouchStart(e, e.currentTarget)}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
      >
        {#each quickRecipes as recipe}
          {@const pricePerPortion = recipe.portions && recipe.portions > 0 ? recipe.estimatedPrice! / recipe.portions : recipe.estimatedPrice!}
          <a 
            href="/recipes/{encodeURIComponent(recipe.title)}"
            class="group overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-[280px] flex-shrink-0 flex flex-col relative hover:shadow-lg transition-all duration-200 select-none"
            style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
            on:click|preventDefault={(e) => {
              // Only navigate if we didn't drag
              if (!hasDragged && !touchHasDragged) {
                goto(`/recipes/${recipe.title}`);
              }
            }}
          >
            <!-- Recipe Image -->
            <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
              {#if recipe.recipeImage}
                <img 
                  src={recipe.recipeImage} 
                  alt={recipe.title}
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style="-webkit-user-drag: none; pointer-events: none;"
                  draggable="false"
                  loading="lazy"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  <CookingPot size={32} class="text-gray-400 dark:text-gray-500" />
                </div>
              {/if}
              
              <!-- Dietary Labels Overlay -->
              {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
                <div class="absolute left-2 top-2 flex flex-wrap gap-1 max-w-[70%]">
                  {#each recipe.dietaryLabels.slice(0, 2) as label}
                    {@const config = getLabelConfig(label)}
                    {@const Icon = config?.icon}
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 {getLabelColorClasses(label, true)}"
                    >
                      {#if Icon}
                        <Icon size={12} />
                      {/if}
                      <span>{label}</span>
                    </span>
                  {/each}
                  {#if recipe.dietaryLabels.length > 2}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                      +{recipe.dietaryLabels.length - 2}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Recipe Content -->
            <div class="flex flex-col flex-grow p-3 sm:p-4">
              <h3 class="font-semibold text-base sm:text-lg leading-tight text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {recipe.title}
              </h3>
              
              {#if recipe.subtitle}
                <p class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  {recipe.subtitle}
                </p>
              {/if}

              <!-- Recipe Info -->
              <div class="mt-auto flex flex-col gap-1.5 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between text-xs sm:text-sm">
                  {#if recipe.prepTime && recipe.prepTime > 0}
                    <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock size={14} class="text-gray-500 dark:text-gray-400" />
                      <span class="font-medium">{recipe.prepTime} min</span>
                    </div>
                  {:else}
                    <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Clock size={14} />
                      <span>-</span>
                    </div>
                  {/if}

                  {#if recipe.portions}
                    <div class="hidden sm:flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users size={14} class="text-gray-500 dark:text-gray-400" />
                      <span class="font-medium">{recipe.portions} {recipe.portions === 1 ? 'porsjon' : 'porsjoner'}</span>
                    </div>
                  {/if}
                </div>

                {#if recipe.estimatedPrice && recipe.estimatedPrice > 0}
                  <div class="flex items-center gap-1 text-gray-900 dark:text-white text-sm sm:text-base">
                    <PiggyBank size={14} class="text-gray-700 dark:text-gray-300" />
                    <span class="font-semibold">{pricePerPortion.toFixed(2)} kr</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">per porsjon</span>
                  </div>
                {:else}
                  <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    <PiggyBank size={14} />
                    <span>Pris ikke tilgjengelig</span>
                  </div>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  

  <!-- Vegetarian Carousel -->
  {#if vegetarianRecipes.length > 0}
    <div class="mb-12">
      <div class="mb-4 px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Leaf size={28} class="text-green-500 dark:text-green-400" />
          Kjøttfritt
        </h2>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div 
        id="vegetarian-carousel"
        role="region"
        aria-label="Kjøttfritt carousel"
        class="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 cursor-grab active:cursor-grabbing"
        style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;"
        on:mousedown={(e) => handleMouseDown(e, e.currentTarget)}
        on:mouseleave={handleMouseLeave}
        on:touchstart={(e) => handleTouchStart(e, e.currentTarget)}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
      >
        {#each vegetarianRecipes as recipe}
          {@const pricePerPortion = recipe.portions && recipe.portions > 0 ? recipe.estimatedPrice! / recipe.portions : recipe.estimatedPrice!}
          <a 
            href="/recipes/{encodeURIComponent(recipe.title)}"
            class="group overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-[280px] flex-shrink-0 flex flex-col relative hover:shadow-lg transition-all duration-200 select-none"
            style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
            on:click|preventDefault={(e) => {
              // Only navigate if we didn't drag
              if (!hasDragged && !touchHasDragged) {
                goto(`/recipes/${recipe.title}`);
              }
            }}
          >
            <!-- Recipe Image -->
            <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
              {#if recipe.recipeImage}
                <img 
                  src={recipe.recipeImage} 
                  alt={recipe.title}
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style="-webkit-user-drag: none; pointer-events: none;"
                  draggable="false"
                  loading="lazy"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  <CookingPot size={32} class="text-gray-400 dark:text-gray-500" />
                </div>
              {/if}
              
              <!-- Dietary Labels Overlay -->
              {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
                <div class="absolute left-2 top-2 flex flex-wrap gap-1 max-w-[70%]">
                  {#each recipe.dietaryLabels.slice(0, 2) as label}
                    {@const config = getLabelConfig(label)}
                    {@const Icon = config?.icon}
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 {getLabelColorClasses(label, true)}"
                    >
                      {#if Icon}
                        <Icon size={12} />
                      {/if}
                      <span>{label}</span>
                    </span>
                  {/each}
                  {#if recipe.dietaryLabels.length > 2}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                      +{recipe.dietaryLabels.length - 2}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Recipe Content -->
            <div class="flex flex-col flex-grow p-3 sm:p-4">
              <h3 class="font-semibold text-base sm:text-lg leading-tight text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {recipe.title}
              </h3>
              
              {#if recipe.subtitle}
                <p class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  {recipe.subtitle}
                </p>
              {/if}

              <!-- Recipe Info -->
              <div class="mt-auto flex flex-col gap-1.5 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between text-xs sm:text-sm">
                  {#if recipe.prepTime && recipe.prepTime > 0}
                    <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock size={14} class="text-gray-500 dark:text-gray-400" />
                      <span class="font-medium">{recipe.prepTime} min</span>
                    </div>
                  {:else}
                    <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Clock size={14} />
                      <span>-</span>
                    </div>
                  {/if}

                  {#if recipe.portions}
                    <div class="hidden sm:flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users size={14} class="text-gray-500 dark:text-gray-400" />
                      <span class="font-medium">{recipe.portions} {recipe.portions === 1 ? 'porsjon' : 'porsjoner'}</span>
                    </div>
                  {/if}
                </div>

                {#if recipe.estimatedPrice && recipe.estimatedPrice > 0}
                  <div class="flex items-center gap-1 text-gray-900 dark:text-white text-sm sm:text-base">
                    <PiggyBank size={14} class="text-gray-700 dark:text-gray-300" />
                    <span class="font-semibold">{pricePerPortion.toFixed(2)} kr</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">per porsjon</span>
                  </div>
                {:else}
                  <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    <PiggyBank size={14} />
                    <span>Pris ikke tilgjengelig</span>
                  </div>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Pescetarian Carousel -->
  {#if pescetarianRecipes.length > 0}
    <div class="mb-12">
      <div class="mb-4 px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Fish size={28} class="text-blue-500 dark:text-blue-400" />
          Fisk til middag?
        </h2>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div 
        id="pescetarian-carousel"
        role="region"
        aria-label="Fisk til middag carousel"
        class="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 cursor-grab active:cursor-grabbing"
        style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;"
        on:mousedown={(e) => handleMouseDown(e, e.currentTarget)}
        on:mouseleave={handleMouseLeave}
        on:touchstart={(e) => handleTouchStart(e, e.currentTarget)}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
      >
        {#each pescetarianRecipes as recipe}
          {@const pricePerPortion = recipe.portions && recipe.portions > 0 ? recipe.estimatedPrice! / recipe.portions : recipe.estimatedPrice!}
          <a 
            href="/recipes/{encodeURIComponent(recipe.title)}"
            class="group overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-[280px] flex-shrink-0 flex flex-col relative hover:shadow-lg transition-all duration-200 select-none"
            style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
            on:click|preventDefault={(e) => {
              // Only navigate if we didn't drag
              if (!hasDragged && !touchHasDragged) {
                goto(`/recipes/${recipe.title}`);
              }
            }}
          >
            <!-- Recipe Image -->
            <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
              {#if recipe.recipeImage}
                <img 
                  src={recipe.recipeImage} 
                  alt={recipe.title}
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style="-webkit-user-drag: none; pointer-events: none;"
                  draggable="false"
                  loading="lazy"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  <CookingPot size={32} class="text-gray-400 dark:text-gray-500" />
                </div>
              {/if}
              
              <!-- Dietary Labels Overlay -->
              {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
                <div class="absolute left-2 top-2 flex flex-wrap gap-1 max-w-[70%]">
                  {#each recipe.dietaryLabels.slice(0, 2) as label}
                    {@const config = getLabelConfig(label)}
                    {@const Icon = config?.icon}
                    <span
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 {getLabelColorClasses(label, true)}"
                    >
                      {#if Icon}
                        <Icon size={12} />
                      {/if}
                      <span>{label}</span>
                    </span>
                  {/each}
                  {#if recipe.dietaryLabels.length > 2}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                      +{recipe.dietaryLabels.length - 2}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Recipe Content -->
            <div class="flex flex-col flex-grow p-3 sm:p-4">
              <h3 class="font-semibold text-base sm:text-lg leading-tight text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {recipe.title}
              </h3>
              
              {#if recipe.subtitle}
                <p class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                  {recipe.subtitle}
                </p>
              {/if}

              <!-- Recipe Info -->
              <div class="mt-auto flex flex-col gap-1.5 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between text-xs sm:text-sm">
                  {#if recipe.prepTime && recipe.prepTime > 0}
                    <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock size={14} class="text-gray-500 dark:text-gray-400" />
                      <span class="font-medium">{recipe.prepTime} min</span>
                    </div>
                  {:else}
                    <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                      <Clock size={14} />
                      <span>-</span>
                    </div>
                  {/if}

                  {#if recipe.portions}
                    <div class="hidden sm:flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users size={14} class="text-gray-500 dark:text-gray-400" />
                      <span class="font-medium">{recipe.portions} {recipe.portions === 1 ? 'porsjon' : 'porsjoner'}</span>
                    </div>
                  {/if}
                </div>

                {#if recipe.estimatedPrice && recipe.estimatedPrice > 0}
                  <div class="flex items-center gap-1 text-gray-900 dark:text-white text-sm sm:text-base">
                    <PiggyBank size={14} class="text-gray-700 dark:text-gray-300" />
                    <span class="font-semibold">{pricePerPortion.toFixed(2)} kr</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">per porsjon</span>
                  </div>
                {:else}
                  <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                    <PiggyBank size={14} />
                    <span>Pris ikke tilgjengelig</span>
                  </div>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>


  {/if}



</section>
{/if}

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
    
    .scrollbar-hide::-webkit-scrollbar {
        display: none;  /* Chrome, Safari and Opera */
    }

    /* Prevent text selection and image dragging in carousels */
    #quick-carousel *,
    #vegetarian-carousel *,
    #pescetarian-carousel * {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -webkit-user-drag: none;
    }

    /* Allow text selection on links when not dragging (for accessibility) */
    #quick-carousel a:active,
    #vegetarian-carousel a:active,
    #pescetarian-carousel a:active {
        user-select: text;
        -webkit-user-select: text;
    }

    section {
        position: relative;
        z-index: 10;
        min-height: 100vh;
        background: transparent;
    }
</style>
