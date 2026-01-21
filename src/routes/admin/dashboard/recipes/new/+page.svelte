<script lang="ts">
  import RecipeEditor from '$lib/components/ui/RecipeEditor.svelte';
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';
  import { goto } from '$app/navigation';
  import toast from 'svelte-french-toast';
  import { nanoid } from 'nanoid';
  import type { Recipe, IngredientWithPrice } from '$lib/types';

  export let data;
  let allIngredients = data.ingredients || [];
  let useVisualEditor = true;
  let error = '';

  // Create a default empty recipe for the editor (default to draft mode)
  const defaultRecipe: Recipe = {
    title: '',
    subtitle: '',
    prepTime: 0,
    portions: 1,
    steps: [],
    recipeIngredients: [],
    recipeId: nanoid(),
    tips: [],
    utkast: true, // Default new recipes to draft mode
    dietaryLabels: [] // Start with empty dietary labels
  };
  
  // Initialize JSON string with default recipe
  let jsonString = JSON.stringify(defaultRecipe, null, 2);

  async function saveFromVisualEditor(event: CustomEvent<Recipe>) {
    const newRecipe = event.detail;
    await saveRecipe(newRecipe);
  }

  async function saveFromJSON() {
    try {
      const newRecipe = JSON.parse(jsonString) as Recipe;
      await saveRecipe(newRecipe);
    } catch (e) {
      error = 'Invalid JSON: ' + (e instanceof Error ? e.message : e);
      toast.error('Ugyldig JSON');
    }
  }

  async function saveRecipe(newRecipe: Recipe) {
    // Ensure recipeId is set
    if (!newRecipe.recipeId) {
      newRecipe.recipeId = nanoid();
    }
    
    // Validate required fields
    if (!newRecipe.title || !newRecipe.title.trim()) {
      toast.error('Tittel er påkrevd');
      return;
    }
    
    if (!newRecipe.steps || newRecipe.steps.length === 0) {
      toast.error('Minst ett steg er påkrevd');
      return;
    }
    
    try {
      const res = await fetch(`/admin/dashboard/api/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe)
      });
      
      if (res.ok) {
        const { insertedId } = await res.json();
        
        // Clear the cache for new recipes after successful save
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(`recipe-editor-cache-${newRecipe.recipeId}`);
            localStorage.removeItem('recipe-editor-cache-new-recipe');
          } catch (e) {
            console.warn('Failed to clear cache:', e);
          }
        }
        
        toast.success(`Ny oppskrift opprettet: ${newRecipe.title}`);
        // Redirect to the edit page for the newly created recipe
        goto(`/admin/dashboard/recipes/${insertedId}`);
      } else {
        const errorData = await res.json();
        error = errorData.error || 'Feil ved opprettelse';
        toast.error('Kunne ikke opprette oppskrift');
      }
    } catch (e) {
      error = 'Feil ved opprettelse: ' + (e instanceof Error ? e.message : e);
      toast.error('Kunne ikke opprette oppskrift');
    }
  }

  function handleCancel() {
    goto('/admin/dashboard');
  }

  function toggleEditorMode() {
    useVisualEditor = !useVisualEditor;
    if (!useVisualEditor) {
      // Switching to JSON: update jsonString from current editor state
      // Note: We can't easily get the current state from RecipeEditor,
      // so we'll just use the default recipe structure
      jsonString = JSON.stringify(defaultRecipe, null, 2);
    }
    // When switching back to Visual, RecipeEditor will use defaultRecipe
    error = '';
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 pt-20">
  <div class="mb-4">
    <Breadcrumb 
      items={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Oppskrifter', href: '/admin/dashboard' },
        { label: 'Ny oppskrift' }
      ]} 
    />
  </div>
  <div class="mb-4 flex justify-between items-center">
    <h2 class="text-2xl font-bold dark:text-white">Ny oppskrift</h2>
    <button
      class="text-blue-600 dark:text-blue-400 underline text-sm"
      on:click={toggleEditorMode}
    >
      {useVisualEditor ? 'JSON Editor' : 'Visual Editor'}
    </button>
  </div>

  {#if useVisualEditor}
    <RecipeEditor
      recipe={defaultRecipe}
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
          Opprett
        </button>
      </div>
    </div>
  {/if}
</div>
