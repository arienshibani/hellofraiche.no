<script>
  import { Card } from "flowbite-svelte";

  /**
   * The meal plans data.
   * @typedef {Object} MealPlan
   * @property {string} name - The name of the meal plan.
   * @property {string} description - The description of the meal plan.
   * @property {number} price - The price of the meal plan.
   */

  /**
   * The data object passed to the component.
   * @typedef {Object} Data
   * @property {MealPlan[]} mealPlans - The list of meal plans.
   */

  /** @type {Data} */
  export let data;

  $: ({ mealPlans } = data);
</script>

<svelte:head>
  <title>Ukemenyer 🗓️ </title>
</svelte:head>


<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">

<h1 class="text-5xl text-center pt-24 font-bold dark:text-white">Ukemenyer 🗓️</h1>

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

<div class="flex justify-evenly flex-wrap max-w-6xl m-auto dark:bg-gray-900">
  {#each mealPlans as mealPlan, index}
    <!-- Recipe items -->
    <Card class="border-none shadow-none dark:bg-gray-900" padding="sm">
      <div class="flex justify-end"></div>
      <div class="flex flex-col items-center pb-4">
        <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white">
          {"#" + (index + 1) + " "}{mealPlan.name}
        </h5>
        <img
          src="https://placehold.co/150x150/?text={mealPlan.name[0]}"
          alt="Placeholder image"
          class="w-40 h-40 rounded-full object-cover mt-4 mb-4"
          aria-hidden="true"
        />
        <div class="flex mt-4 space-x-3 lg:mt-6">
          <a href="/plans/{mealPlan.name}">
            <button
              class="items-center self-center border border-black border-r-4 border-b-4 rounded-sm h-10 w-fit pr-4 pl-4 m-5 hover:scale-110 transition-transform duration-300 dark:bg-gray-800 dark:text-white dark:border-white"
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
