<script>
  import { Card } from "flowbite-svelte";
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  export let data;
  let { recipes } = data;

  // Search query state
  let search = "";
  /** @type {HTMLInputElement} */
  let searchInput;

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

  // Reactive filtered list based on search input
  $: filteredRecipes = recipes.filter(recipe => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      recipe.title.toLowerCase().includes(term) ||
      recipe.subtitle.toLowerCase().includes(term) ||
      recipe.recipeIngredients?.some(ing => ing.name.toLowerCase().includes(term))
    );
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
</script>

<svelte:window on:keydown={handleShortcut} />

<svelte:head>
  <title>Søk etter oppskrifter 🔍</title>
</svelte:head>



<div class="dark:text-gray-200 dark:bg-gray-900">



<h1 class="text-5xl text-center pt-24 pb-20 font-bold dark:text-white">Oppskrifter 🗒️</h1>

<div class="flex justify-center p-10 w-fit m-auto dark:bg-gray-900">
  <form class="flex items-center w-full max-w-4xl" on:submit|preventDefault={handleSearch}>
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
    <button type="submit" class="p-2.5 ml-2 text-sm font-medium text-white bg-slate-700 rounded-lg border border-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-slate-800">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
      <span class="sr-only">Søk</span>
    </button>
  </form>
</div>

<div class="flex justify-evenly flex-wrap max-w-5xl m-auto dark:bg-gray-900">
  {#each filteredRecipes as recipe}
    <Card class="border-none shadow-none dark:bg-gray-900" padding="sm">
      <div class="flex flex-col items-center pb-4">
        <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">{recipe.title}</h5>
        <span class="text-sm text-gray-500 dark:text-gray-400">{recipe.subtitle}</span>
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