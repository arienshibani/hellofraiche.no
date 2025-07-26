<script>
  import { Card } from "flowbite-svelte";
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { CookingPot, DollarSign, ArrowUp, ArrowDown } from "lucide-svelte";

  export let data;
  let { recipes } = data;

  // Search query state
  let search = "";
  /** @type {HTMLInputElement} */
  let searchInput;
  
  // Sorting state
  let sortBy = 'none'; // 'none', 'price-asc', 'price-desc'

  // Initialize search from URL once on mount
  onMount(() => {
    search = $page.url.searchParams.get('search') || '';
  });

  // Update browser URL without navigation on search change
  $: if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (search) params.set('search', search);
    else params.delete('search');
    const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    history.replaceState(null, '', newUrl);
  }

  // Reactive filtered and sorted list
  $: filteredRecipes = recipes
    .filter(recipe => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return (
        recipe.title.toLowerCase().includes(term) ||
        recipe.subtitle.toLowerCase().includes(term) ||
        recipe.recipeIngredients?.some(ing => ing.name.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') {
        const priceA = a.estimatedPrice || 0;
        const priceB = b.estimatedPrice || 0;
        return priceA - priceB;
      } else if (sortBy === 'price-desc') {
        const priceA = a.estimatedPrice || 0;
        const priceB = b.estimatedPrice || 0;
        return priceB - priceA;
      }
      return 0; // No sorting
    });

  function handleSearch(event) {
    event.preventDefault();
  }

  function handleShortcut(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
  }
  
  function toggleSort() {
    if (sortBy === 'none') {
      sortBy = 'price-asc';
    } else if (sortBy === 'price-asc') {
      sortBy = 'price-desc';
    } else {
      sortBy = 'none';
    }
  }
</script>

<svelte:window on:keydown={handleShortcut} />

<svelte:head>
  <title>Søk etter oppskrifter 🔍</title>
</svelte:head>

<div class="dark:text-gray-200 dark:bg-gray-900">

<h1 class="text-5xl text-center pt-48 pb-20 font-bold dark:text-white flex items-center justify-center gap-3">
  <CookingPot size={48} class="text-gray-700 dark:text-gray-300" />
  Oppskrifter
</h1>

<div class="flex justify-center p-10 w-fit m-auto dark:bg-gray-900">
  <div class="flex items-center w-full max-w-4xl gap-2">
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
          placeholder="oppskrift / ingrediens"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-slate-500 dark:focus:border-slate-500"
        />
      </div>
    </form>
    
    <!-- Sort Button -->
    <button 
      type="button"
      on:click={toggleSort}
      class="p-2.5 text-sm font-medium text-white bg-slate-600 rounded-lg border border-slate-600 hover:bg-slate-700 focus:ring-4 focus:outline-none focus:ring-slate-300 dark:bg-slate-500 dark:hover:bg-slate-600 dark:focus:ring-slate-800 transition-colors w-14 h-10 flex items-center justify-center"
      title="Sorter etter pris"
    >
      <div class="flex items-center justify-center w-full gap-1">
        <DollarSign size={16} />
        {#if sortBy === 'price-asc'}
          <ArrowUp size={14} />
        {:else if sortBy === 'price-desc'}
          <ArrowDown size={14} />
        {:else}
          <div class="w-3.5"></div>
        {/if}
      </div>
    </button>
  </div>
</div>

<div class="flex justify-evenly flex-wrap max-w-5xl m-auto dark:bg-gray-900">
  {#each filteredRecipes as recipe}
    <Card class="border-none shadow-none dark:bg-gray-900" padding="sm">
      <div class="flex flex-col items-center pb-4">
        <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{recipe.title}</h5>
        <span class="text-sm text-gray-500 dark:text-gray-400">{recipe.subtitle}</span>
        
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
</div>
</div>

<style>
  button:hover {
    color: white;
    background-color: black;
    border-color: white;
  }
</style>