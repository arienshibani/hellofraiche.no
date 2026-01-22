<script lang="ts">
  import RecipeEditor from '$lib/components/ui/RecipeEditor.svelte';
  import { goto } from '$app/navigation';
  import toast from 'svelte-french-toast';
  import type { Recipe, IngredientWithPrice } from '$lib/types';

  export let data;
  let recipe = data.recipe;
  let allIngredients = data.ingredients || [];
  let useVisualEditor = true;
  let jsonString = JSON.stringify(recipe, null, 2);
  let error = '';

  if (!recipe) {
    goto('/admin/dashboard');
  }

  async function saveFromVisualEditor(event: CustomEvent<Recipe>) {
    const updated = event.detail;
    await saveRecipe(updated);
  }

  async function saveFromJSON() {
    try {
      const updated = JSON.parse(jsonString);
      await saveRecipe(updated);
    } catch (e) {
      error = 'Invalid JSON: ' + (e instanceof Error ? e.message : e);
      toast.error('Ugyldig JSON');
    }
  }

  async function saveRecipe(updated: Recipe) {
    if (!recipe?._id) return;
    
    try {
      const res = await fetch(`/admin/dashboard/api/recipes/${recipe._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      if (res.ok) {
        // Clear cache after successful save
        if (typeof window !== 'undefined' && recipe.recipeId) {
          try {
            localStorage.removeItem(`recipe-editor-cache-${recipe.recipeId}`);
          } catch (e) {
            console.warn('Failed to clear cache:', e);
          }
        }
        
        toast.success(`Oppskrift oppdatert: ${updated.title}`);
        // Reload the page to get fresh data
        window.location.reload();
      } else {
        const errorData = await res.json();
        error = errorData.error || 'Feil ved lagring';
        toast.error('Kunne ikke lagre oppskrift');
      }
    } catch (e) {
      error = 'Feil ved lagring: ' + (e instanceof Error ? e.message : e);
      toast.error('Kunne ikke lagre oppskrift');
    }
  }

  function handleCancel() {
    goto('/admin/dashboard');
  }

  function handlePreview() {
    if (recipe?.title) {
      // Open the public recipe page in a new tab
      window.open(`/recipes/${encodeURIComponent(recipe.title)}`, '_blank');
    } else {
      toast.error('Kan ikke forhåndsvise: Oppskrift mangler tittel');
    }
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 pt-20">
  <div class="mb-4 flex justify-between items-center">
    <h2 class="text-2xl font-bold dark:text-white">Rediger oppskrift</h2>
    <div class="flex gap-4 items-center">
      {#if recipe?.title}
        <button
          class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline text-sm flex items-center gap-1"
          on:click={handlePreview}
          title="Forhåndsvis oppskrift som vanlig bruker"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Forhåndsvis
        </button>
      {/if}
      <button
        class="text-blue-600 dark:text-blue-400 underline text-sm"
        on:click={() => useVisualEditor = !useVisualEditor}
      >
        {useVisualEditor ? 'JSON Editor' : 'Visual Editor'}
      </button>
    </div>
  </div>

  {#if useVisualEditor && recipe}
    <RecipeEditor
      {recipe}
      {allIngredients}
      on:save={saveFromVisualEditor}
      on:cancel={handleCancel}
    />
  {:else}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 class="text-xl font-bold mb-4 dark:text-white">JSON Editor</h3>
      <textarea
        class="w-full border rounded p-2 font-mono dark:bg-gray-700 dark:text-white min-h-[500px]"
        bind:value={jsonString}
      />
      {#if error}
        <div class="text-red-600 dark:text-red-400 mt-2">{error}</div>
      {/if}
      <div class="flex justify-end gap-2 mt-4">
        <button
          class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          on:click={handleCancel}
        >
          Avbryt
        </button>
        <button
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          on:click={saveFromJSON}
        >
          Lagre
        </button>
      </div>
    </div>
  {/if}
</div>
