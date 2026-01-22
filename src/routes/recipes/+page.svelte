<script lang="ts">
  import { Card } from "flowbite-svelte";
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { CookingPot, PiggyBank, ArrowUp, ArrowDown, Clock, X, Filter, Users, RotateCcw, Type } from "lucide-svelte";
  import { getLabelConfig, getLabelColorClasses, PREDEFINED_DIETARY_LABELS, normalizeDietaryLabel } from '$lib/util/dietaryLabels';
  import type { Recipe } from '$lib/types';

  export let data;
  type RecipeWithPrice = Recipe & { estimatedPrice?: number };
  let { recipes } = data as { recipes: RecipeWithPrice[] };
  
  // Debug: Log price data to verify it's available
  $: if (typeof window !== 'undefined' && recipes.length > 0) {
    const sampleRecipes = recipes.slice(0, 3);
    console.log('Sample recipes with prices:', sampleRecipes.map(r => ({
      title: r.title,
      estimatedPrice: (r as RecipeWithPrice).estimatedPrice,
      hasPrice: 'estimatedPrice' in r
    })));
  }
  
  // Search query state
  let search = "";
  let searchInput: HTMLInputElement | undefined;
  let searchInputDesktop: HTMLInputElement | undefined;
  
  // Filter state
  let selectedDietaryLabels: string[] = [];
  let maxPrepTime: number | null = null;
  let drawerOpen = false; // For mobile drawer
  
  // Sorting state
  let sortBy: 'none' | 'price-asc' | 'price-desc' | 'prepTime-asc' | 'prepTime-desc' | 'title-asc' = 'none';

  let lastSyncedURL = '';

  // Sync state from URL (only when URL changes externally, like back button)
  function syncStateFromURL() {
    const currentURL = $page.url.search;
    if (currentURL === lastSyncedURL) return; // URL hasn't changed
    
    lastSyncedURL = currentURL;
    search = $page.url.searchParams.get('search') || '';
    const labelsParam = $page.url.searchParams.get('labels');
    selectedDietaryLabels = labelsParam ? labelsParam.split(',').filter(Boolean) : [];
    const prepTimeParam = $page.url.searchParams.get('prepTime');
    maxPrepTime = prepTimeParam ? parseInt(prepTimeParam, 10) : null;
    const sortParam = $page.url.searchParams.get('sort');
    const validSorts: Array<'none' | 'price-asc' | 'price-desc' | 'prepTime-asc' | 'prepTime-desc' | 'title-asc'> = ['none', 'price-asc', 'price-desc', 'prepTime-asc', 'prepTime-desc', 'title-asc'];
    sortBy = (sortParam && validSorts.includes(sortParam as any)) ? (sortParam as typeof sortBy) : 'none';
  }

  // Sync state from URL when page URL changes (handles back/forward navigation)
  $: {
    syncStateFromURL();
  }

  // Initialize on mount
  onMount(() => {
    lastSyncedURL = $page.url.search;
    syncStateFromURL();
  });

  // Lock body scroll when drawer is open (mobile only)
  $: if (typeof window !== 'undefined') {
    if (drawerOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
    }
  });

  // Update URL when state changes
  function updateURL() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedDietaryLabels.length > 0) {
      params.set('labels', selectedDietaryLabels.join(','));
    }
    if (maxPrepTime !== null) {
      params.set('prepTime', maxPrepTime.toString());
    }
    if (sortBy !== 'none') {
      params.set('sort', sortBy);
    }
    const queryString = params.toString();
    const newUrl = $page.url.pathname + (queryString ? `?${queryString}` : '');
    const newSearch = queryString ? `?${queryString}` : '';
    
    // Update lastSyncedURL before navigation to prevent sync
    lastSyncedURL = newSearch;
    
    goto(newUrl, { 
      invalidateAll: false, 
      noScroll: true,
      keepFocus: true,
      replaceState: true
    });
  }

  // Update URL when state changes (debounced to avoid too many updates)
  let updateTimeout: ReturnType<typeof setTimeout>;
  $: {
    if (typeof window !== 'undefined') {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        // Only update if URL would be different
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedDietaryLabels.length > 0) {
          params.set('labels', selectedDietaryLabels.join(','));
        }
        if (maxPrepTime !== null) {
          params.set('prepTime', maxPrepTime.toString());
        }
        if (sortBy !== 'none') {
          params.set('sort', sortBy);
        }
        const queryString = params.toString();
        const expectedURL = queryString ? `?${queryString}` : '';
        if (expectedURL !== lastSyncedURL) {
          updateURL();
        }
      }, 150);
    }
  }

  // Get all unique dietary labels from recipes
  $: allAvailableLabels = Array.from(
    new Set(
      recipes.flatMap(recipe => (recipe.dietaryLabels || []).map(label => normalizeDietaryLabel(label)))
    )
  ).sort();

  // Reactive filtered and sorted list
  $: filteredRecipes = recipes
    .filter(recipe => {
      // Text search filter
      const term = search.trim().toLowerCase();
      if (term) {
        const matchesSearch = (
          recipe.title.toLowerCase().includes(term) ||
          recipe.subtitle?.toLowerCase().includes(term) ||
          recipe.recipeIngredients?.some(ing => ing.name.toLowerCase().includes(term))
        );
        if (!matchesSearch) return false;
      }

      // Dietary labels filter - OR logic (union): show recipes with ANY selected label
      if (selectedDietaryLabels.length > 0) {
        const recipeLabels = (recipe.dietaryLabels || []).map(label => normalizeDietaryLabel(label));
        const normalizedSelectedLabels = selectedDietaryLabels.map(label => normalizeDietaryLabel(label));
        const hasAnySelectedLabel = normalizedSelectedLabels.some(label => 
          recipeLabels.includes(label)
        );
        if (!hasAnySelectedLabel) return false;
      }

      // Prep time filter
      if (maxPrepTime !== null) {
        const prepTime = recipe.prepTime || 0;
        if (prepTime > maxPrepTime) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') {
        const priceA = (a as RecipeWithPrice).estimatedPrice ?? 0;
        const priceB = (b as RecipeWithPrice).estimatedPrice ?? 0;
        return priceA - priceB;
      } else if (sortBy === 'price-desc') {
        const priceA = (a as RecipeWithPrice).estimatedPrice ?? 0;
        const priceB = (b as RecipeWithPrice).estimatedPrice ?? 0;
        return priceB - priceA;
      } else if (sortBy === 'prepTime-asc') {
        const prepA = a.prepTime || 0;
        const prepB = b.prepTime || 0;
        return prepA - prepB;
      } else if (sortBy === 'prepTime-desc') {
        const prepA = a.prepTime || 0;
        const prepB = b.prepTime || 0;
        return prepB - prepA;
      } else if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, 'no');
      }
      return 0; // No sorting
    });

  function handleSearch(event: Event) {
    event.preventDefault();
  }

  function handleShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      // Focus mobile input on mobile, desktop input on desktop
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        searchInput?.focus();
      } else {
        searchInputDesktop?.focus();
      }
    }
  }
  
  function toggleDietaryLabel(label: string) {
    if (selectedDietaryLabels.includes(label)) {
      selectedDietaryLabels = selectedDietaryLabels.filter(l => l !== label);
    } else {
      selectedDietaryLabels = [...selectedDietaryLabels, label];
    }
  }

  function setPrepTimeFilter(minutes: number | null) {
    maxPrepTime = minutes;
  }

  function clearAllFilters() {
    search = '';
    selectedDietaryLabels = [];
    maxPrepTime = null;
    sortBy = 'none';
  }

  function hasActiveFilters(): boolean {
    return search.trim() !== '' || selectedDietaryLabels.length > 0 || maxPrepTime !== null || sortBy !== 'none';
  }

  function hasActiveFiltersExcludingSort(): boolean {
    return search.trim() !== '' || selectedDietaryLabels.length > 0 || maxPrepTime !== null;
  }

  // Close drawer when clicking outside (mobile only)
  function handleDrawerBackdropClick(event: MouseEvent | KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('drawer-backdrop')) {
      drawerOpen = false;
    }
  }

  function handleDrawerBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDrawerBackdropClick(event);
    }
  }

  // Close drawer on escape key
  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && drawerOpen) {
      drawerOpen = false;
    }
  }

  const prepTimeOptions = [
    { label: 'Raskt (under 15 min)', value: 15 },
    { label: 'Middels (under 30 min)', value: 30 },
    { label: 'Lengre (under 60 min)', value: 60 }
  ];

  // Count recipes matching a specific dietary label (considering current search and other filters)
  function countRecipesWithLabel(label: string): number {
    return recipes.filter(recipe => {
      // Text search filter
      const term = search.trim().toLowerCase();
      if (term) {
        const matchesSearch = (
          recipe.title.toLowerCase().includes(term) ||
          recipe.subtitle?.toLowerCase().includes(term) ||
          recipe.recipeIngredients?.some(ing => ing.name.toLowerCase().includes(term))
        );
        if (!matchesSearch) return false;
      }

      // Check if recipe has this label
      const recipeLabels = (recipe.dietaryLabels || []).map(label => normalizeDietaryLabel(label));
      const normalizedLabel = normalizeDietaryLabel(label);
      if (!recipeLabels.includes(normalizedLabel)) return false;

      // Prep time filter
      if (maxPrepTime !== null) {
        const prepTime = recipe.prepTime || 0;
        if (prepTime > maxPrepTime) return false;
      }

      return true;
    }).length;
  }

  // Count recipes matching a specific prep time filter (considering current search and other filters)
  function countRecipesWithPrepTime(prepTimeValue: number | null): number {
    return recipes.filter(recipe => {
      // Text search filter
      const term = search.trim().toLowerCase();
      if (term) {
        const matchesSearch = (
          recipe.title.toLowerCase().includes(term) ||
          recipe.subtitle?.toLowerCase().includes(term) ||
          recipe.recipeIngredients?.some(ing => ing.name.toLowerCase().includes(term))
        );
        if (!matchesSearch) return false;
      }

      // Dietary labels filter - OR logic (union): show recipes with ANY selected label
      if (selectedDietaryLabels.length > 0) {
        const recipeLabels = (recipe.dietaryLabels || []).map(label => normalizeDietaryLabel(label));
        const normalizedSelectedLabels = selectedDietaryLabels.map(label => normalizeDietaryLabel(label));
        const hasAnySelectedLabel = normalizedSelectedLabels.some(label => 
          recipeLabels.includes(label)
        );
        if (!hasAnySelectedLabel) return false;
      }

      // Prep time filter
      if (prepTimeValue === null) {
        // "Alle" option - no prep time filter
        return true;
      } else {
        const prepTime = recipe.prepTime || 0;
        if (prepTime > prepTimeValue) return false;
      }

      return true;
    }).length;
  }
</script>

<svelte:window on:keydown={(e) => { handleShortcut(e); handleEscapeKey(e); }} />

<svelte:head>
  <title> Søk | Hellofraiche </title>
</svelte:head>

<div class="dark:text-gray-200 dark:bg-gray-900 min-h-screen">

<!-- Main Container: Grid Layout for Desktop, Stacked for Mobile -->
<div class="max-w-7xl mx-auto px-4 dark:bg-gray-900 lg:grid lg:grid-cols-12 lg:gap-6 pt-4">
  
  <!-- Mobile: Search Bar with Filter Button -->
  <div class="lg:hidden mb-4">
    <div class="flex items-center gap-2">
      <form class="flex items-center flex-1" on:submit|preventDefault={handleSearch}>
        <label for="search-input" class="sr-only">Søk</label>
        <div class="relative w-full">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <input
            type="text"
            id="search-input"
            bind:this={searchInput}
            bind:value={search}
            placeholder="Søk etter oppskrift, ingrediens..."
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          {#if search}
            <button
              type="button"
              on:click={() => search = ''}
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Tøm søk"
            >
              <X size={16} />
            </button>
          {/if}
        </div>
      </form>
      <!-- Filter Button (Mobile) -->
      <button
        type="button"
        on:click={() => drawerOpen = true}
        class="flex-shrink-0 p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
        aria-label="Åpne filtre"
      >
        <Filter size={20} class="text-gray-600 dark:text-gray-400" />
        {#if hasActiveFilters()}
          <span class="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-medium">
            {selectedDietaryLabels.length + (maxPrepTime !== null ? 1 : 0) + (sortBy !== 'none' ? 1 : 0) + (search.trim() ? 1 : 0)}
          </span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Desktop: Filters Sidebar (Left) -->
  <aside class="hidden lg:block lg:col-span-3">
    <div class="sticky top-24 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold dark:text-white flex items-center gap-2">
          <Filter size={18} class="text-gray-600 dark:text-gray-400" />
          Filtre
        </h2>
      </div>

      <!-- Filter Content -->
      <div class="space-y-6">
        <!-- Dietary Labels Filter -->
        <div>
          <h3 class="block text-sm font-medium dark:text-gray-300 mb-3">Kosthold</h3>
          <div class="flex flex-wrap gap-2">
            {#each allAvailableLabels as label}
              {@const config = getLabelConfig(label)}
              {@const Icon = config?.icon}
              {@const isSelected = selectedDietaryLabels.includes(label)}
              <button
                type="button"
                on:click={() => toggleDietaryLabel(label)}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 {isSelected ? getLabelColorClasses(label, true) + ' ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : getLabelColorClasses(label, false) + ' opacity-70 hover:opacity-100'}"
              >
                {#if Icon}
                  <Icon size={16} />
                {/if}
                <span>{normalizeDietaryLabel(label)}</span>
                <span class="ml-1 text-xs opacity-75">({countRecipesWithLabel(label)})</span>
                {#if isSelected}
                  <X size={14} />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Prep Time Filter -->
        <div>
          <h3 class="block text-sm font-medium dark:text-gray-300 mb-3">Forberedelsestid</h3>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              on:click={() => setPrepTimeFilter(null)}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all {maxPrepTime === null ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
            >
              <Clock size={16} />
              Alle
              <span class="ml-1 text-xs opacity-75">({countRecipesWithPrepTime(null)})</span>
            </button>
            {#each prepTimeOptions as option}
              {@const isSelected = maxPrepTime === option.value}
              <button
                type="button"
                on:click={() => setPrepTimeFilter(option.value)}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all {isSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
              >
                <Clock size={16} />
                {option.label}
                <span class="ml-1 text-xs opacity-75">({countRecipesWithPrepTime(option.value)})</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Clear Filters Button (Desktop) -->
        {#if hasActiveFilters()}
          <div class="pt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              on:click={clearAllFilters}
              class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Nullstill alle filtre
            </button>
          </div>
        {/if}

        <!-- Sort Options -->
        <div>
          <h3 class="block text-sm font-medium dark:text-gray-300 mb-3">Sorter</h3>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              on:click={() => sortBy = sortBy === 'title-asc' ? 'none' : 'title-asc'}
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between {sortBy === 'title-asc' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
            >
              <span class="flex items-center gap-2">
                <Type size={14} />
                Navn
              </span>
              {#if sortBy === 'title-asc'}
                <ArrowUp size={14} />
              {/if}
            </button>
            <button
              type="button"
              on:click={() => sortBy = sortBy === 'prepTime-asc' ? 'prepTime-desc' : sortBy === 'prepTime-desc' ? 'none' : 'prepTime-asc'}
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between {sortBy.startsWith('prepTime') ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
            >
              <span class="flex items-center gap-2">
                <Clock size={14} />
                Tid
              </span>
              {#if sortBy === 'prepTime-asc'}
                <ArrowUp size={14} />
              {:else if sortBy === 'prepTime-desc'}
                <ArrowDown size={14} />
              {/if}
            </button>
            <button
              type="button"
              on:click={() => sortBy = sortBy === 'price-asc' ? 'price-desc' : sortBy === 'price-desc' ? 'none' : 'price-asc'}
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between {sortBy.startsWith('price') ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
            >
              <span class="flex items-center gap-2">
                <PiggyBank size={14} />
                Pris
              </span>
              {#if sortBy === 'price-asc'}
                <ArrowUp size={14} />
              {:else if sortBy === 'price-desc'}
                <ArrowDown size={14} />
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content Area: Search (Desktop) + Results -->
  <main class="lg:col-span-9">
    <!-- Desktop: Search Bar -->
    <div class="hidden lg:block mb-6">
      <form class="flex items-center" on:submit|preventDefault={handleSearch}>
        <label for="search-input-desktop" class="sr-only">Søk</label>
        <div class="relative w-full">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <input
            type="text"
            id="search-input-desktop"
            bind:this={searchInputDesktop}
            bind:value={search}
            placeholder="Søk etter oppskrift, ingrediens..."
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          {#if search}
            <button
              type="button"
              on:click={() => search = ''}
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Tøm søk"
            >
              <X size={16} />
            </button>
          {/if}
        </div>
      </form>
    </div>

    <!-- Results Count -->
    <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Viser <span class="font-semibold">{filteredRecipes.length}</span> av <span class="font-semibold">{recipes.length}</span> oppskrifter
      {#if hasActiveFiltersExcludingSort()}
        <span class="text-xs text-gray-500 dark:text-gray-500 ml-2">(filtrert)</span>
      {/if}
    </div>

    <!-- Recipes Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 pb-8">
  {#if filteredRecipes.length === 0}
    <div class="col-span-full text-center py-12">
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-2">Ingen oppskrifter funnet</p>
      <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">Prøv å justere filtrene eller søket</p>
      {#if hasActiveFilters()}
        <button
          type="button"
          on:click={clearAllFilters}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors dark:bg-blue-900"
        >
          Nullstill filtre
        </button>
      {/if}
    </div>
  {:else}
    {#each filteredRecipes as recipe}
    <a 
      href="/recipes/{encodeURIComponent(recipe.title)}"
      class="group overflow-hidden rounded-xl lg:rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-full w-full flex flex-col relative hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
    >
      <!-- Recipe Image -->
      <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {#if recipe.recipeImage}
          <img 
            src={recipe.recipeImage} 
            alt={recipe.title}
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            <CookingPot size={32} class="lg:size-12 text-gray-400 dark:text-gray-500" />
          </div>
        {/if}
        
        <!-- Dietary Labels Overlay (top left) -->
        {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
          <div class="absolute left-1.5 lg:left-3 top-1.5 lg:top-3 flex flex-wrap gap-1 max-w-[70%]">
            {#each recipe.dietaryLabels.slice(0, 1) as label}
              {@const config = getLabelConfig(label)}
              {@const Icon = config?.icon}
              <span
                class="inline-flex items-center gap-0.5 lg:gap-1 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 {getLabelColorClasses(label, true)}"
              >
                {#if Icon}
                  <Icon size={10} class="lg:size-3" />
                {/if}
                <span class="hidden lg:inline">{label}</span>
              </span>
            {/each}
            {#if recipe.dietaryLabels.length > 1}
              <span class="inline-flex items-center px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                +{recipe.dietaryLabels.length - 1}
              </span>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Recipe Content -->
      <div class="flex flex-col flex-grow p-2 lg:p-4">
        <!-- Title -->
        <h3 class="font-semibold text-sm lg:text-lg leading-tight text-gray-900 dark:text-white mb-1 lg:mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {recipe.title}
        </h3>
        
        <!-- Subtitle (if exists) - hidden on mobile -->
        {#if recipe.subtitle}
          <p class="hidden lg:block text-sm text-gray-600 dark:text-gray-400 mb-2 lg:mb-3 line-clamp-1">
            {recipe.subtitle}
          </p>
        {/if}

        <!-- Recipe Info (Prep Time, Portions, Price) -->
        <div class="mt-auto flex flex-col gap-1.5 lg:gap-2 pt-2 lg:pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between text-xs lg:text-sm">
            <!-- Prep Time -->
            {#if recipe.prepTime && recipe.prepTime > 0}
              <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Clock size={12} class="lg:size-4 text-gray-500 dark:text-gray-400" />
                <span class="font-medium">{recipe.prepTime} min</span>
              </div>
            {:else}
              <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <Clock size={12} class="sm:size-4" />
                <span>-</span>
              </div>
            {/if}

            <!-- Portions - hidden on mobile, shown on sm+ -->
            {#if recipe.portions}
              <div class="hidden lg:flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Users size={16} class="text-gray-500 dark:text-gray-400" />
                <span class="font-medium">{recipe.portions} {recipe.portions === 1 ? 'porsjon' : 'porsjoner'}</span>
              </div>
            {/if}
          </div>

          <!-- Price -->
          {#if recipe.estimatedPrice && recipe.estimatedPrice > 0}
            {@const pricePerPortion = recipe.portions && recipe.portions > 0 ? recipe.estimatedPrice / recipe.portions : recipe.estimatedPrice}
            <div class="flex items-center gap-1 text-gray-900 dark:text-white">
              <PiggyBank size={12} class="lg:size-4 text-gray-700 dark:text-gray-300" />
              <span class="font-semibold text-sm lg:text-base">{pricePerPortion.toFixed(2)} kr</span>
              <span class="hidden lg:inline text-xs text-gray-500 dark:text-gray-400">per porsjon</span>
            </div>
          {:else}
            <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs lg:text-sm">
              <PiggyBank size={12} class="lg:size-4" />
              <span class="hidden lg:inline">Pris ikke tilgjengelig</span>
              <span class="lg:hidden">-</span>
            </div>
          {/if}
        </div>
      </div>
    </a>
    {/each}
  {/if}
    </div>
  </main>
</div>

<!-- Mobile Drawer for Filters -->
{#if drawerOpen}
  <!-- Backdrop -->
  <div
    class="drawer-backdrop fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
    on:click={handleDrawerBackdropClick}
    on:keydown={handleDrawerBackdropKeydown}
    role="button"
    tabindex="-1"
    aria-label="Lukk filtre"
  ></div>
  
  <!-- Drawer Panel -->
  <div
    class="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-out overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="drawer-title"
  >
    <div class="p-6">
      <!-- Drawer Header -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 id="drawer-title" class="text-xl font-semibold dark:text-white flex items-center gap-2">
          <Filter size={20} class="text-gray-600 dark:text-gray-400" />
          Filtre
        </h2>
        <button
          type="button"
          on:click={() => drawerOpen = false}
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Lukk filtre"
        >
          <X size={20} class="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <!-- Filter Content -->
      <div class="space-y-6">
        <!-- Dietary Labels Filter -->
        <div>
          <h3 class="block text-sm font-medium dark:text-gray-300 mb-3">Kosthold</h3>
          <div class="flex flex-wrap gap-2">
            {#each allAvailableLabels as label}
              {@const config = getLabelConfig(label)}
              {@const Icon = config?.icon}
              {@const isSelected = selectedDietaryLabels.includes(label)}
              <button
                type="button"
                on:click={() => toggleDietaryLabel(label)}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 {isSelected ? getLabelColorClasses(label, true) + ' ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : getLabelColorClasses(label, false) + ' opacity-70 hover:opacity-100'}"
              >
                {#if Icon}
                  <Icon size={16} />
                {/if}
                <span>{normalizeDietaryLabel(label)}</span>
                <span class="ml-1 text-xs opacity-75">({countRecipesWithLabel(label)})</span>
                {#if isSelected}
                  <X size={14} />
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Prep Time Filter -->
        <div>
          <h3 class="block text-sm font-medium dark:text-gray-300 mb-3">Forberedelsestid</h3>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              on:click={() => setPrepTimeFilter(null)}
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all {maxPrepTime === null ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
            >
              <Clock size={16} />
              Alle
              <span class="ml-1 text-xs opacity-75">({countRecipesWithPrepTime(null)})</span>
            </button>
            {#each prepTimeOptions as option}
              {@const isSelected = maxPrepTime === option.value}
              <button
                type="button"
                on:click={() => setPrepTimeFilter(option.value)}
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all {isSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
              >
                <Clock size={16} />
                {option.label}
                <span class="ml-1 text-xs opacity-75">({countRecipesWithPrepTime(option.value)})</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Clear Filters Button (Mobile) -->
        {#if hasActiveFilters()}
          <div class="pt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              on:click={() => { clearAllFilters(); drawerOpen = false; }}
              class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Nullstill alle filtre
            </button>
          </div>
        {/if}

        <!-- Sort Options -->
        <div>
          <h3 class="block text-sm font-medium dark:text-gray-300 mb-3">Sorter</h3>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              on:click={() => sortBy = sortBy === 'title-asc' ? 'none' : 'title-asc'}
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between {sortBy === 'title-asc' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
            >
              <span class="flex items-center gap-2">
                <Type size={14} />
                Navn
              </span>
              {#if sortBy === 'title-asc'}
                <ArrowUp size={14} />
              {/if}
            </button>
            <button
              type="button"
              on:click={() => sortBy = sortBy === 'prepTime-asc' ? 'prepTime-desc' : sortBy === 'prepTime-desc' ? 'none' : 'prepTime-asc'}
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between {sortBy.startsWith('prepTime') ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
            >
              <span class="flex items-center gap-2">
                <Clock size={14} />
                Tid
              </span>
              {#if sortBy === 'prepTime-asc'}
                <ArrowUp size={14} />
              {:else if sortBy === 'prepTime-desc'}
                <ArrowDown size={14} />
              {/if}
            </button>
            <button
              type="button"
              on:click={() => sortBy = sortBy === 'price-asc' ? 'price-desc' : sortBy === 'price-desc' ? 'none' : 'price-asc'}
              class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between {sortBy.startsWith('price') ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
            >
              <span class="flex items-center gap-2">
                <PiggyBank size={14} />
                Pris
              </span>
              {#if sortBy === 'price-asc'}
                <ArrowUp size={14} />
              {:else if sortBy === 'price-desc'}
                <ArrowDown size={14} />
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
</div>

<style>
  button:hover {
    color: white;
    background-color: black;
    border-color: white;
  }
</style>