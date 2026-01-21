<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { validateEAN } from '$lib/util/validateEAN';
  import toast from 'svelte-french-toast';

  export let selectedRecipe: any = null;
  export let allIngredients: any[] = [];

  const dispatch = createEventDispatcher();

  // Check if ingredient has valid price data
  function hasPriceData(ingredientName: string): boolean {
    const ingredient = allIngredients.find((ai: any) => ai.name === ingredientName);
    if (!ingredient) return false;
    if (!ingredient.ean) return false;
    if (!ingredient.data || !ingredient.data.products || !Array.isArray(ingredient.data.products)) return false;
    return ingredient.data.products.some((product: any) => 
      product.current_price && product.current_price.price && product.current_price.price > 0
    );
  }

  // Get ingredient from database
  function getIngredientFromDB(ingredientName: string) {
    return allIngredients.find((ai: any) => ai.name === ingredientName);
  }

  // Categorize ingredients
  $: missingIngredients = selectedRecipe?.recipeIngredients
    ? selectedRecipe.recipeIngredients
        .filter((ri: any) => !ri.isBulkItem)
        .map((ri: any) => {
          const dbIngredient = getIngredientFromDB(ri.name);
          if (!dbIngredient) {
            return { name: ri.name, status: 'missing_from_db', ean: '', _id: null };
          }
          if (!dbIngredient.ean) {
            return { name: ri.name, status: 'missing_ean', ean: '', _id: dbIngredient._id };
          }
          if (!hasPriceData(ri.name)) {
            return { name: ri.name, status: 'missing_price', ean: dbIngredient.ean, _id: dbIngredient._id };
          }
          return null;
        })
        .filter((ing: any) => ing !== null)
    : [];

  // EAN input state
  let eanInputs: Record<string, string> = {};
  let eanErrors: Record<string, string> = {};
  let updatingEAN: Record<string, boolean> = {};

  function handleClose() {
    dispatch('close');
  }

  function handleAdd(name: string) {
    dispatch('addIngredient', { name });
  }

  function handleAddBulk(name: string) {
    dispatch('addBulk', { name });
  }

  async function handleUpdateEAN(ingredient: any) {
    const ean = eanInputs[ingredient.name]?.trim() || '';
    
    if (!ean) {
      eanErrors[ingredient.name] = 'EAN er påkrevd';
      return;
    }

    if (!validateEAN(ean)) {
      eanErrors[ingredient.name] = 'Ugyldig EAN-nummer (må være 13 siffer)';
      return;
    }

    eanErrors[ingredient.name] = '';
    updatingEAN[ingredient.name] = true;

    try {
      const dbIngredient = getIngredientFromDB(ingredient.name);
      if (!dbIngredient || !dbIngredient._id) {
        // Need to create ingredient first
        const createResponse = await fetch('/admin/dashboard/api/ingredients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: ingredient.name, ean })
        });

        if (!createResponse.ok) {
          throw new Error('Kunne ikke opprette ingrediens');
        }

        toast.success(`EAN lagt til for ${ingredient.name}. Pris-scanneren vil hente priser ved neste kjøring.`);
        dispatch('refresh');
        delete eanInputs[ingredient.name];
      } else {
        // Update existing ingredient
        const updateResponse = await fetch('/admin/dashboard/api/ingredients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ _id: dbIngredient._id, name: ingredient.name, ean })
        });

        if (!updateResponse.ok) {
          throw new Error('Kunne ikke oppdatere EAN');
        }

        toast.success(`EAN oppdatert for ${ingredient.name}. Pris-scanneren vil hente priser ved neste kjøring.`);
        dispatch('refresh');
        delete eanInputs[ingredient.name];
      }
    } catch (error: any) {
      eanErrors[ingredient.name] = error.message || 'Feil ved oppdatering av EAN';
      toast.error(`Feil: ${error.message || 'Kunne ikke oppdatere EAN'}`);
    } finally {
      updatingEAN[ingredient.name] = false;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'missing_from_db':
        return 'Mangler i database';
      case 'missing_ean':
        return 'Mangler EAN-nummer';
      case 'missing_price':
        return 'Mangler prisdata';
      default:
        return '';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'missing_from_db':
        return 'text-red-600 dark:text-red-400';
      case 'missing_ean':
        return 'text-orange-600 dark:text-orange-400';
      case 'missing_price':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return '';
    }
  }
</script>

{#if selectedRecipe}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold mb-4 dark:text-white">{selectedRecipe.title}</h3>
      
      {#if missingIngredients.length === 0}
        <div class="text-green-600 font-semibold mb-4 dark:text-green-400">
          Alle ingredienser har prisdata! ✓
        </div>
      {:else}
        <div class="mb-2 font-semibold dark:text-gray-100">
          Ingredienser som mangler prisdata:
        </div>
        <ul class="mb-4 space-y-3">
          {#each missingIngredients as ing}
            <li class="border border-gray-200 dark:border-gray-700 rounded p-3">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex-1">
                  <span class="font-medium dark:text-white">{ing.name}</span>
                  <span class="ml-2 text-sm {getStatusColor(ing.status)}">
                    ({getStatusLabel(ing.status)})
                  </span>
                </div>
                {#if ing.status === 'missing_from_db'}
                  <div class="flex gap-2">
                    <button 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                      on:click={() => handleAdd(ing.name)}
                    >
                      Legg til
                    </button>
                    <button 
                      class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                      on:click={() => handleAddBulk(ing.name)}
                    >
                      Marker som bulk
                    </button>
                  </div>
                {/if}
              </div>
              
              {#if ing.status === 'missing_ean' || ing.status === 'missing_price'}
                <div class="mt-2 flex gap-2 items-start">
                  <div class="flex-1">
                    <input
                      type="text"
                      placeholder="Skriv inn EAN-nummer (13 siffer)"
                      class="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 {eanErrors[ing.name] ? 'border-red-500' : ''}"
                      bind:value={eanInputs[ing.name]}
                      disabled={updatingEAN[ing.name]}
                      on:keydown={(e) => {
                        if (e.key === 'Enter' && !updatingEAN[ing.name]) {
                          handleUpdateEAN(ing);
                        }
                      }}
                    />
                    {#if eanErrors[ing.name]}
                      <p class="text-red-500 text-xs mt-1">{eanErrors[ing.name]}</p>
                    {/if}
                    {#if ing.status === 'missing_price' && ing.ean}
                      <p class="text-gray-500 text-xs mt-1">
                        Eksisterende EAN: {ing.ean} (venter på pris-scanning)
                      </p>
                    {/if}
                  </div>
                  <button
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    on:click={() => handleUpdateEAN(ing)}
                    disabled={updatingEAN[ing.name]}
                  >
                    {updatingEAN[ing.name] ? 'Oppdaterer...' : ing.status === 'missing_ean' ? 'Legg til EAN' : 'Oppdater EAN'}
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
      
      <div class="flex justify-end gap-2 mt-4">
        <button 
          class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          on:click={handleClose}
        >
          Lukk
        </button>
      </div>
    </div>
  </div>
{/if}
