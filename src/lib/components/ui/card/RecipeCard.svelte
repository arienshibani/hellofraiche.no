<script lang="ts">
  export let recipe: any;
  export let showAdminActions: boolean = false;
  export let coverage: number | undefined = undefined;
  export let allIngredients: any[] = [];
  import { createEventDispatcher } from 'svelte';
  import AddIngredientModal from '$lib/components/ui/modals/AddIngredientModal.svelte';
  import CoverageModal from '$lib/components/ui/modals/CoverageModal.svelte';
  const dispatch = createEventDispatcher();

  $: coverageColor = coverage === undefined
    ? ''
    : coverage >= 90
      ? 'text-green-600 dark:text-green-400'
      : coverage >= 50
        ? 'text-orange-500 dark:text-orange-400'
        : 'text-red-600 dark:text-red-400';

  let showCoverageModal = false;
  let showAddModal = false;
  let addName = '';
  let addEAN = '';
  let addError = '';

  $: missingIngredients = recipe.recipeIngredients
    ? recipe.recipeIngredients.filter((ri: any) => !allIngredients.some(ai => ai.name === ri.name))
    : [];

  function openCoverageModal() {
    showCoverageModal = true;
  }
  function closeCoverageModal() {
    showCoverageModal = false;
  }
  function openAddModal(name: string) {
    addName = name;
    addEAN = '';
    addError = '';
    showAddModal = true;
  }
  function closeAddModal() {
    showAddModal = false;
  }
  function handleAddIngredient({ detail }) {
    if (!detail.name || !detail.ean) {
      addError = 'Navn og EAN er påkrevd';
      return;
    }
    addError = '';
    dispatch('addIngredient', { name: detail.name, ean: detail.ean });
    // Don't close modal, let parent update allIngredients and thus missingIngredients
  }
  function handleCoverageAdd({ detail }) {
    openAddModal(detail.name);
  }
</script>

<div class="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex items-center justify-between cursor-pointer group">
  <div>
    <div class="font-bold text-lg group-hover:text-blue-700 transition-colors dark:text-white">{recipe.title}</div>
    <div class="text-gray-600 dark:text-gray-300">{recipe.subtitle}</div>
  </div>
  {#if showAdminActions}
    <div class="flex gap-2 items-center">
      {#if coverage !== undefined}
        <span class={`text-xs font-semibold ${coverageColor} cursor-pointer`} on:click={openCoverageModal}>{coverage}% Ingredient index</span>
      {/if}
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded dark:bg-blue-900" on:click={() => dispatch('edit', recipe)}>Rediger Oppskrift ✍️</button>
      <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded dark:bg-red-900" on:click={() => dispatch('delete', recipe)}>Slett Oppskrift 🗑️</button>
    </div>
  {/if}
</div>

<CoverageModal
  open={showCoverageModal}
  recipeTitle={recipe.title}
  missingIngredients={missingIngredients}
  on:close={closeCoverageModal}
  on:add={handleCoverageAdd}
/>

<AddIngredientModal
  name={addName}
  ean={addEAN}
  error={addError}
  open={showAddModal}
  on:save={handleAddIngredient}
  on:close={closeAddModal}
/>