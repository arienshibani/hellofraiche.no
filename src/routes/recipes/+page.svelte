<script lang="ts">
  import { Card } from "flowbite-svelte";
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { CookingPot, DollarSign, ArrowUp, ArrowDown, Clock, X, Filter, ChevronDown } from "lucide-svelte";
  import { getLabelConfig, getLabelColorClasses, PREDEFINED_DIETARY_LABELS } from '$lib/util/dietaryLabels';
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
  
  // Filter state
  let selectedDietaryLabels: string[] = [];
  let maxPrepTime: number | null = null; // null = no filter, number = max minutes
  let filtersOpen = false; // Filter panel is closed by default
  
  // Sorting state
  let sortBy: 'none' | 'price-asc' | 'price-desc' | 'prepTime-asc' | 'prepTime-desc' | 'title-asc' = 'none';

  // Initialize search from URL once on mount
  onMount(() => {
    search = $page.url.searchParams.get('search') || '';
    const labelsParam = $page.url.searchParams.get('labels');
    if (labelsParam) {
      selectedDietaryLabels = labelsParam.split(',').filter(Boolean);
    }
    const prepTimeParam = $page.url.searchParams.get('prepTime');
    if (prepTimeParam) {
      maxPrepTime = parseInt(prepTimeParam, 10);
    }
  });

  // Update browser URL without navigation on filter changes
  $: if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('search', search);
    else params.delete('search');
    if (selectedDietaryLabels.length > 0) {
      params.set('labels', selectedDietaryLabels.join(','));
    } else {
      params.delete('labels');
    }
    if (maxPrepTime !== null) {
      params.set('prepTime', maxPrepTime.toString());
    } else {
      params.delete('prepTime');
    }
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    history.replaceState(null, '', newUrl);
  }

  // Get all unique dietary labels from recipes
  $: allAvailableLabels = Array.from(
    new Set(
      recipes.flatMap(recipe => recipe.dietaryLabels || [])
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

      // Dietary labels filter
      if (selectedDietaryLabels.length > 0) {
        const recipeLabels = recipe.dietaryLabels || [];
        const hasAllSelectedLabels = selectedDietaryLabels.every(label => 
          recipeLabels.includes(label)
        );
        if (!hasAllSelectedLabels) return false;
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
      searchInput?.focus();
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

  const prepTimeOptions = [
    { label: 'Raskt (under 15 min)', value: 15 },
    { label: 'Middels (under 30 min)', value: 30 },
    { label: 'Lengre (under 60 min)', value: 60 }
  ];
</script>

<svelte:window on:keydown={handleShortcut} />

<svelte:head>
  <title>Søk etter oppskrifter 🔍</title>
</svelte:head>

<div class="dark:text-gray-200 dark:bg-gray-900">

<h1 class="text-5xl text-center pt-48 pb-12 font-bold dark:text-white flex items-center justify-center gap-3">
  <CookingPot size={48} class="text-gray-700 dark:text-gray-300" />
  Oppskrifter
</h1>

<!-- Search and Filters Section -->
<div class="max-w-6xl mx-auto px-4 pb-8 dark:bg-gray-900">
  <!-- Search Bar -->
  <div class="flex items-center gap-2 mb-6">
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
  </div>

  <!-- Filters Section -->
  <div class="bg-gray-50 dark:bg-gray-800 rounded-lg mb-6 border border-gray-200 dark:border-gray-700 overflow-hidden">
    <!-- Filter Header (Always Visible) -->
    <button
      type="button"
      on:click={() => filtersOpen = !filtersOpen}
      class="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-expanded={filtersOpen}
      aria-controls="filter-content"
    >
      <div class="flex items-center gap-2">
        <Filter size={18} class="text-gray-600 dark:text-gray-400" />
        <h2 class="text-lg font-semibold dark:text-white">Filtre</h2>
        {#if hasActiveFilters()}
          <span class="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-medium">
            {selectedDietaryLabels.length + (maxPrepTime !== null ? 1 : 0) + (sortBy !== 'none' ? 1 : 0) + (search.trim() ? 1 : 0)} aktiv
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if hasActiveFilters()}
          <button
            type="button"
            on:click|stopPropagation={clearAllFilters}
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            title="Nullstill alle filtre"
          >
            <X size={14} />
            Nullstill
          </button>
        {/if}
        <ChevronDown 
          size={20} 
          class="text-gray-600 dark:text-gray-400 transition-transform duration-200 {filtersOpen ? 'rotate-180' : ''}" 
        />
      </div>
    </button>

    <!-- Filter Content (Collapsible) -->
    {#if filtersOpen}
      <div 
        id="filter-content"
        transition:slide={{ duration: 300 }}
        class="px-4 pb-4"
      >
        <!-- Dietary Labels Filter -->
    <div class="mb-4">
      <label class="block text-sm font-medium dark:text-gray-300 mb-2">Kostholdsmerker</label>
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
            <span>{label}</span>
            {#if isSelected}
              <X size={14} />
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Prep Time Filter -->
    <div class="mb-4">
      <label class="block text-sm font-medium dark:text-gray-300 mb-2">Forberedelsestid</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          on:click={() => setPrepTimeFilter(null)}
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all {maxPrepTime === null ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
        >
          <Clock size={16} />
          Alle
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
          </button>
        {/each}
      </div>
    </div>

    <!-- Sort Options -->
    <div>
      <label class="block text-sm font-medium dark:text-gray-300 mb-2">Sorter</label>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          on:click={() => sortBy = 'none'}
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all {sortBy === 'none' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
        >
          Standard
        </button>
        <button
          type="button"
          on:click={() => sortBy = sortBy === 'title-asc' ? 'none' : 'title-asc'}
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 {sortBy === 'title-asc' ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
        >
          Navn
          {#if sortBy === 'title-asc'}
            <ArrowUp size={14} />
          {/if}
        </button>
        <button
          type="button"
          on:click={() => sortBy = sortBy === 'prepTime-asc' ? 'prepTime-desc' : sortBy === 'prepTime-desc' ? 'none' : 'prepTime-asc'}
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 {sortBy.startsWith('prepTime') ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
        >
          <Clock size={14} />
          Tid
          {#if sortBy === 'prepTime-asc'}
            <ArrowUp size={14} />
          {:else if sortBy === 'prepTime-desc'}
            <ArrowDown size={14} />
          {/if}
        </button>
        <button
          type="button"
          on:click={() => sortBy = sortBy === 'price-asc' ? 'price-desc' : sortBy === 'price-desc' ? 'none' : 'price-asc'}
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 {sortBy.startsWith('price') ? 'bg-blue-600 text-white dark:bg-blue-700' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}"
        >
          <DollarSign size={14} />
          Pris
          {#if sortBy === 'price-asc'}
            <ArrowUp size={14} />
          {:else if sortBy === 'price-desc'}
            <ArrowDown size={14} />
          {/if}
        </button>
      </div>
    </div>
      </div>
    {/if}
  </div>

  <!-- Results Count -->
  <div class="text-sm text-gray-600 dark:text-gray-400 mb-4">
    Viser <span class="font-semibold">{filteredRecipes.length}</span> av <span class="font-semibold">{recipes.length}</span> oppskrifter
    {#if hasActiveFilters()}
      <span class="text-xs text-gray-500 dark:text-gray-500 ml-2">(filtrert)</span>
    {/if}
  </div>
</div>

<!-- Recipes Grid -->
<div class="flex justify-evenly flex-wrap max-w-5xl m-auto dark:bg-gray-900 px-4">
  {#if filteredRecipes.length === 0}
    <div class="w-full text-center py-12">
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
    <Card class="border-none shadow-none dark:bg-gray-900" padding="sm">
      <div class="flex flex-col items-center pb-4">
        <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{recipe.title}</h5>
        <span class="text-sm text-gray-500 dark:text-gray-400">{recipe.subtitle}</span>
        
        <!-- Dietary Labels -->
        {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
          <div class="flex flex-wrap justify-center gap-1.5 mt-2 mb-2">
            {#each recipe.dietaryLabels as label}
              {@const config = getLabelConfig(label)}
              {@const Icon = config?.icon}
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {getLabelColorClasses(label, true)}"
              >
                {#if Icon}
                  <Icon size={12} />
                {/if}
                <span>{label}</span>
              </span>
            {/each}
          </div>
        {/if}
        
        <!-- Prep Time Display -->
        {#if recipe.prepTime && recipe.prepTime > 0}
          <div class="mt-2 mb-2 flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Clock size={16} class="text-gray-500 dark:text-gray-400" />
            <span class="font-medium">{recipe.prepTime} min</span>
          </div>
        {/if}
        
        <!-- Price Display -->
        {#if recipe.estimatedPrice && recipe.estimatedPrice > 0}
          <div class="mt-2 text-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">Estimert pris:</span>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              {recipe.estimatedPrice.toFixed(2)} kr
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">per porsjon</span>
          </div>
        {:else}
          <div class="mt-2 text-center">
            <span class="text-xs text-gray-400 dark:text-gray-500">Pris ikke tilgjengelig</span>
          </div>
        {/if}
        
        <div class="flex mt-4 space-x-3 lg:mt-6">
          <a href="/recipes/{recipe.title}">
            <button class="items-center self-center border border-black border-r-4 border-b-4 rounded-sm h-10 w-fit pr-4 pl-4 m-5 dark:bg-gray-800 dark:text-white dark:border-white">
              Se Oppskrift
            </button>
          </a>
        </div>
      </div>
    </Card>
    {/each}
  {/if}
</div>
</div>

<style>
  button:hover {
    color: white;
    background-color: black;
    border-color: white;
  }
</style>