<script lang="ts">
  import { Card } from "flowbite-svelte";
  import { Calendar } from "lucide-svelte";

  /**
   * The meal plans data.
   * @typedef {Object} MealPlan
   * @property {string} name - The name of the meal plan.
   * @property {string} description - The description of the meal plan.
   * @property {number} price - The price of the meal plan.
   * @property {number} estimatedPrice - The estimated price for the entire meal plan.
   * @property {Array<Object>} recipes - The recipes in the meal plan with estimated prices.
   */

  /**
   * The data object passed to the component.
   * @typedef {Object} Data
   * @property {MealPlan[]} mealPlans - The list of meal plans.
   */

  /** @type {Data} */
  export let data;

  $: ({ mealPlans } = data);

  // Soothing color palette for meal plan cards
  const soothingColors = [
    'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800',
    'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800',
    'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800',
    'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800',
    'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800',
    'bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800',
    'bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800',
    'bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900 dark:to-rose-800',
    'bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800',
    'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800',
    'bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900 dark:to-violet-800',
    'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800',
  ];

  // Get color for a meal plan based on its index
  const getColorForMealPlan = (index: number) => {
    return soothingColors[index % soothingColors.length];
  };
</script>

<svelte:head>
  <title>Ukemenyer 🗓️ </title>
</svelte:head>


<div class="flex flex-col items-center justify-center pt-4 sm:pt-8 lg:pt-12">



<!-- Search Bar #TODO: Make a functional search bar here -->
<!-- <div class="flex justify-center p-10">
    <form class="flex items-center w-full max-w-4xl">
        <label for="simple-search" class="sr-only">Søk</label>
        <div class="relative w-full">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
            </div>
            <input type="text" id="simple-search" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-slate-500 dark:focus:border-slate-500" placeholder="Søk etter oppskrifter, ingredienser eller ukemenyer" required>
        </div>
        <button type="submit" class="p-2.5 ml-2 text-sm font-medium text-white bg-slate-700 rounded-lg border border-slate-700 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-slate-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <span class="sr-only">Søk</span>
        </button>
    </form>
</div> -->

<div class="w-full max-w-7xl mx-auto px-4 mb-4 sm:mb-6">
  <p class="text-center text-gray-700 dark:text-gray-300 text-xl sm:text-2xl font-bold px-2">
    Én Handleliste = 4 Måltid 🍽️
  </p>
  <hr class="my-3 sm:my-4 border-gray-300 dark:border-gray-700 border-0 w-3/4 sm:w-1/2 mx-auto">
  <p class="text-center text-gray-700 dark:text-gray-300 text-xs sm:text-sm px-4">
    Hver ukemeny inneholder fire middager, og kan tilpasses antall personer. Prisen er et estimat og baserer seg data fra Meny.
  </p>
  <br>
  <hr class="my-3 sm:my-4 border-gray-300 dark:border-gray-700 border-1 w-3/4 sm:w-1/2 mx-auto">
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
  {#each mealPlans as mealPlan, index}
    <!-- Recipe items -->
    <Card class="border-none shadow-none bg-transparent dark:bg-transparent" padding="sm">
      <div class="flex flex-col items-center pb-2 sm:pb-4">
        <h5 class="mb-1 text-lg sm:text-xl font-medium text-gray-900 dark:text-white text-center px-2">
          {mealPlan.name}
        </h5>
        {#if mealPlan.estimatedPrice && mealPlan.estimatedPrice > 0}
          <div class="mt-2 text-center">
            <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Estimert pris</span>
            <div class="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {mealPlan.estimatedPrice.toFixed(2)} kr
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">Per person</span>
          </div>
        {:else}
          <div class="mt-2 text-center">
            <span class="text-xs text-gray-400 dark:text-gray-500">Pris ikke tilgjengelig</span>
          </div>
        {/if}
        <div
          class="w-24 h-24 sm:w-32 sm:h-32 rounded-full mt-3 sm:mt-4 mb-3 sm:mb-4 {getColorForMealPlan(index)} flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105"
          aria-hidden="true"
        >
        </div>
        <div class="flex mt-2 sm:mt-4 space-x-3 lg:mt-6">
          <a href="/plans/{mealPlan.name}" class="w-full sm:w-auto">
            <button
              class="items-center self-center border border-black border-r-4 border-b-4 rounded-sm h-10 w-full sm:w-fit pr-4 pl-4 m-2 sm:m-5 hover:scale-110 transition-transform duration-300 dark:bg-gray-800 dark:text-white dark:border-white"
            >
              Se Ukemeny
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
