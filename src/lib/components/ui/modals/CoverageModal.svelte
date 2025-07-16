<script lang="ts">
  export let open: boolean = false;
  export let recipeTitle: string = '';
  export let missingIngredients: { name: string }[] = [];
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch('close');
  }
  function handleAdd(name: string) {
    dispatch('add', { name });
  }
</script>

{#if open}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-4 dark:text-white">{recipeTitle}</h3>
      <div class="mb-2 font-semibold dark:text-gray-100">Mangler i ingrediensindeks:</div>
      {#if missingIngredients.length === 0}
        <div class="text-green-600 font-semibold mb-4 dark:text-green-400">Alle ingredienser er indeksert!</div>
      {:else}
        <ul class="mb-4">
          {#each missingIngredients as ing}
            <li class="flex items-center justify-between mb-2">
              <span class="dark:text-white">{ing.name}</span>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs" on:click={() => handleAdd(ing.name)}>Legg til</button>
            </li>
          {/each}
        </ul>
      {/if}
      <div class="flex justify-end gap-2 mt-4">
        <button class="bg-gray-400 text-white px-4 py-2 rounded" on:click={handleClose}>Lukk</button>
      </div>
    </div>
  </div>
{/if} 