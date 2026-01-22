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

  $: filteredIngredients = recipe.recipeIngredients
    ? recipe.recipeIngredients.filter((ri: any) => !ri.isBulkItem)
    : [];
  $: missingIngredients = filteredIngredients
    ? filteredIngredients.filter((ri: any) => !allIngredients.some(ai => ai.name === ri.name))
    : [];

  const openCoverageModal = () => {
    showCoverageModal = true;
  };
  const closeCoverageModal = () => {
    showCoverageModal = false;
  };
  const openAddModal = (name: string) => {
    addName = name;
    addEAN = '';
    addError = '';
    showAddModal = true;
  };
  const closeAddModal = () => {
    showAddModal = false;
  };
  const handleAddIngredient = ({ detail }: { detail: { name: string; ean: string } }) => {
    if (!detail.name || !detail.ean) {
      addError = 'Navn og EAN er påkrevd';
      return;
    }
    addError = '';
    dispatch('addIngredient', { name: detail.name, ean: detail.ean });

    // Also update the recipe's ingredient with the EAN
    fetch(`/admin/dashboard/api/recipes/${recipe._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updateEAN: {
          name: detail.name,
          ean: detail.ean
        }
      })
    }).then(() => {
      // Refresh to show updated recipe with EAN
      dispatch('refresh');
    });

    // Don't close modal, let parent update allIngredients and thus missingIngredients
  };
  const handleCoverageAdd = ({ detail }: { detail: { name: string } }) => {
    openAddModal(detail.name);
  };

  const handleCoverageAddBulk = async ({ detail }: { detail: { name: string } }) => {
    try {
      // PATCH the recipe to set isBulkItem: true for the ingredient with this name
      const response = await fetch(`/admin/dashboard/api/recipes/${recipe._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markBulk: detail.name })
      });

      if (response.ok) {
        // Successfully marked as bulk, refresh the recipe data
        dispatch('refresh');
        closeCoverageModal();
      } else {
        console.error('Failed to mark ingredient as bulk');
      }
    } catch (error) {
      console.error('Error marking ingredient as bulk:', error);
    }
  };
</script>

<div class="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex items-center justify-between cursor-pointer group">
  <div>
    <div class="font-bold text-lg group-hover:text-blue-700 transition-colors dark:text-white">{recipe.title}</div>
    <div class="text-gray-600 dark:text-gray-300">{recipe.subtitle}</div>
  </div>
  {#if showAdminActions}
    <div class="flex gap-2 items-center">
      {#if coverage !== undefined}
        <button type="button" class={`text-xs font-semibold ${coverageColor} cursor-pointer bg-transparent border-0 p-0`} on:click={openCoverageModal}>{coverage}% Ingredient index</button>
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
  on:addBulk={handleCoverageAddBulk}
/>

<AddIngredientModal
  name={addName}
  ean={addEAN}
  error={addError}
  open={showAddModal}
  on:save={handleAddIngredient}
  on:close={closeAddModal}
/>
