<script lang="ts">
  import { onMount } from 'svelte';
  import toast from 'svelte-french-toast';
  import { nanoid } from 'nanoid';
  import { goto } from '$app/navigation';
  import { Tabs, TabItem } from 'flowbite-svelte';
  import { ALL_MEASUREMENT_UNITS } from '$lib/util/conversions';
  import RecipesTable from '$lib/components/ui/RecipesTable.svelte';
  import IngredientsAdminTable from '$lib/components/ui/IngredientsAdminTable.svelte';
  import IngredientsAlert from '$lib/components/ui/IngredientsAlert.svelte';
  import RecipeEditor from '$lib/components/ui/RecipeEditor.svelte';
  import { validateEAN } from '$lib/util/validateEAN';
  import type { Recipe, IngredientWithPrice } from '$lib/types';

  export let data: { recipes: Recipe[]; ingredients: IngredientWithPrice[] };
  
  // Initialize with safe defaults
  let recipes: Recipe[] = [];
  let allIngredients: IngredientWithPrice[] = [];
  let isLoading = false; // Data is loaded server-side, no need for loading state

  // Initialize data safely
  $: {
    if (data) {
      recipes = data.recipes || [];
      allIngredients = data.ingredients || [];
    }
  }

  // Search functionality
  let recipeSearchTerm = '';
  let ingredientSearchTerm = '';

  // Filtered results
  $: filteredRecipes = recipes.filter(recipe => 
    recipe?.title?.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
    recipe?.subtitle?.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
    recipe?.mealPlanId?.toLowerCase().includes(recipeSearchTerm.toLowerCase())
  );

  $: filteredIngredients = allIngredients.filter(ingredient => 
    ingredient?.name?.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) ||
    ingredient?.ean?.includes(ingredientSearchTerm)
  );

  // Clear search functions
  function clearRecipeSearch() {
    recipeSearchTerm = '';
  }

  function clearIngredientSearch() {
    ingredientSearchTerm = '';
  }


  let showModal = false;
  let editingRecipe: Recipe | null = null;
  let jsonString = '';
  let error = '';
  let isCreating = false;
  let showRawJson = false;
  let useVisualEditor = true; // Default to visual editor

  // Form state for new recipe
  let formRecipe: Partial<Recipe> & { steps: string[]; recipeIngredients: any[] } = {
    title: '',
    subtitle: '',
    prepTime: 0,
    portions: 0,
    steps: [],
    mealPlanId: '',
    recipeIngredients: [],
    recipeId: ''
  };
  let newStep = '';
  let newIngredient = { name: '', amount: 0, measurement: 'stk' };
  let selectedIngredientId = '';

  // Searchable dropdown state
  let dropdownIngredientSearch = '';
  let showIngredientDropdown = false;

  // Filtered ingredients for dropdown
  $: filteredDropdownIngredients = allIngredients.filter(ingredient =>
    ingredient.name?.toLowerCase().includes(dropdownIngredientSearch.toLowerCase())
  );

  // Ingredient modal state
  let showIngredientModal = false;
  let isEditingIngredient = false;
  let editingIngredient: IngredientWithPrice | null = null;
  let ingredientForm = { name: '', ean: '' };
  let ingredientError = '';



  // Deletion modal state
  let showDeleteModal = false;
  let deleteTarget: Recipe | IngredientWithPrice | null = null;
  let deleteType: 'recipe' | 'ingredient' = 'recipe';
  let deleteMessage = '';

  function openModal(recipe: Recipe) {
    editingRecipe = recipe;
    jsonString = JSON.stringify(recipe, null, 2);
    error = '';
    showModal = true;
    isCreating = false;
    useVisualEditor = true; // Default to visual editor
  }

  function openCreateModal() {
    editingRecipe = null;
    formRecipe = {
      title: '',
      subtitle: '',
      prepTime: 0,
      portions: 0,
      steps: [],
      mealPlanId: '',
      recipeIngredients: [],
      recipeId: nanoid()
    };
    newStep = '';
    newIngredient = { name: '', amount: 0, measurement: '' };
    selectedIngredientId = '';
    dropdownIngredientSearch = '';
    showIngredientDropdown = false;
    error = '';
    showModal = true;
    isCreating = true;
    showRawJson = false;
    useVisualEditor = true; // Default to visual editor
    jsonString = JSON.stringify(formRecipe, null, 2);
  }

  function closeModal() {
    showModal = false;
    editingRecipe = null;
    jsonString = '';
    error = '';
    isCreating = false;
  }

  function addStep() {
    if (newStep.trim()) {
      formRecipe.steps = [...formRecipe.steps, newStep.trim()];
      newStep = '';
    }
  }
  function removeStep(idx: number) {
    formRecipe.steps = formRecipe.steps.filter((_, i) => i !== idx);
  }

  function addIngredient() {
    if (selectedIngredientId && newIngredient.amount > 0 && newIngredient.measurement.trim()) {
      const ingredientObj = allIngredients.find(i => i._id === selectedIngredientId);
      if (ingredientObj) {
        formRecipe.recipeIngredients = [
          ...formRecipe.recipeIngredients,
          {
            name: ingredientObj.name,
            amount: newIngredient.amount,
            measurement: newIngredient.measurement
          }
        ];
        newIngredient = { name: '', amount: 0, measurement: '' };
        selectedIngredientId = '';
        dropdownIngredientSearch = '';
        showIngredientDropdown = false;
      }
    }
  }

  function selectIngredient(ingredient: IngredientWithPrice) {
    selectedIngredientId = ingredient._id;
    dropdownIngredientSearch = ingredient.name;
    showIngredientDropdown = false;
  }

  function toggleIngredientDropdown() {
    showIngredientDropdown = !showIngredientDropdown;
    if (showIngredientDropdown) {
      dropdownIngredientSearch = '';
    }
  }

  function clearIngredientSelection() {
    selectedIngredientId = '';
    dropdownIngredientSearch = '';
    showIngredientDropdown = false;
  }

  function removeIngredient(idx: number) {
    formRecipe.recipeIngredients = formRecipe.recipeIngredients.filter((_, i) => i !== idx);
  }

  function getIngredientDisplay(ing: any): string {
    return `${ing?.name || ''} (${ing?.amount || 0} ${ing?.measurement || ''})`;
  }

  function toggleInputMode() {
    if (showRawJson) {
      // Switching to form: try to parse JSON and update formRecipe
      try {
        formRecipe = JSON.parse(jsonString);
        error = '';
      } catch (e) {
        error = 'Invalid JSON: ' + (e instanceof Error ? e.message : e);
        return;
      }
    } else {
      // Switching to raw JSON: update jsonString from formRecipe
      jsonString = JSON.stringify(formRecipe, null, 2);
    }
    showRawJson = !showRawJson;
  }

  function toggleEditorMode() {
    useVisualEditor = !useVisualEditor;
    if (!useVisualEditor) {
      // Switching to JSON: update jsonString from editingRecipe
      jsonString = JSON.stringify(editingRecipe, null, 2);
    }
  }

  function handleRecipeEditorSave(event: { detail: Recipe }) {
    editingRecipe = event.detail;
    jsonString = JSON.stringify(event.detail, null, 2);
    save();
  }

  function handleRecipeEditorCancel() {
    closeModal();
  }

  async function save() {
    try {
      let updated;
      if (isCreating) {
        updated = showRawJson ? JSON.parse(jsonString) : { ...formRecipe };
      } else {
        updated = JSON.parse(jsonString);
      }
      let res;
      if (isCreating) {
        res = await fetch(`/admin/dashboard/api/recipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          const { insertedId } = await res.json();
          toast.success(`Lagt til ny oppskrift: ${updated.title || 'N/A'}`);
          recipes = [
            { ...updated, _id: insertedId },
            ...recipes
          ];
          closeModal();
        } else {
          error = 'Error saving';
          toast.error('Feilet lagring');
        }
      } else {
        // @ts-ignore
        res = await fetch(`/admin/dashboard/api/recipes/${editingRecipe._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok && editingRecipe) {
          const recipeId = editingRecipe._id;
          toast.success(`Oppdatert oppskrift: ${updated.title || editingRecipe.title || 'Untitled Recipe'}`);
          recipes = recipes.map(r =>
            r._id === recipeId ? { ...updated, _id: recipeId } : r
          );
          closeModal();
        } else {
          error = 'Error saving';
          toast.error('Feilet lagring');
        }
      }
    } catch (e) {
      error = 'Invalid JSON: ' + (e instanceof Error ? e.message : e);
      toast.error(error);
    }
  }

  // @ts-ignore
  async function deleteRecipe(recipe) {
    let id = recipe._id;
    if (typeof id === 'object' && id.$oid) id = id.$oid;
    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) return;
    const res = await fetch(`/admin/dashboard/api/recipes/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      toast.success(`Slettet oppskrift "${recipe.title || undefined}""`);
      // Remove the deleted recipe from the recipes array
      // @ts-ignore
      recipes = recipes.filter(r => r._id !== id);
      closeModal();
    } else {
      let msg = 'Error deleting';
      try {
        const data = await res.json();
        if (data && data.error) msg += `: ${data.error}`;
      } catch (e) {
        msg += ' (no error details)';
      }
      console.error('Delete failed', res.status, res.statusText, await res.text());
      toast.error(msg);
    }
  }

  // Close modal on Escape key
  function handleKeydown(event: KeyboardEvent) {
    // Don't interfere with input/textarea elements
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return; // Let input/textarea handle their own events
    }

    if (showModal && event.key === 'Escape') {
      closeModal();
    }

    // Search shortcuts: Ctrl+F for recipe search, Ctrl+Shift+F for ingredient search
    if (event.ctrlKey && event.key === 'f' && !event.shiftKey) {
      event.preventDefault();
      const input = document.querySelector('input[placeholder*="oppskrifter"]') as HTMLInputElement;
      input?.focus();
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'F') {
      event.preventDefault();
      const input = document.querySelector('input[placeholder*="ingredienser"]') as HTMLInputElement;
      input?.focus();
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (showIngredientDropdown && !target.closest('.ingredient-dropdown')) {
      showIngredientDropdown = false;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('click', handleClickOutside);
    };
  });

  function openEditIngredient(ingredient: IngredientWithPrice) {
    isEditingIngredient = true;
    editingIngredient = ingredient;
    ingredientForm = { name: ingredient.name, ean: ingredient.ean || '' };
    ingredientError = '';
    showIngredientModal = true;
  }
  function openNewIngredient() {
    isEditingIngredient = false;
    editingIngredient = null;
    ingredientForm = { name: '', ean: '' };
    ingredientError = '';
    showIngredientModal = true;
  }
  function closeIngredientModal() {
    showIngredientModal = false;
    editingIngredient = null;
    ingredientForm = { name: '', ean: '' };
    ingredientError = '';
  }
  async function saveIngredient() {
    if (!ingredientForm.name || !ingredientForm.ean) {
      ingredientError = 'Navn og EAN er påkrevd';
      return;
    }
    if (!validateEAN(ingredientForm.ean)) {
      ingredientError = 'Ugyldig EAN-nummer';
      return;
    }
    let res;
    if (isEditingIngredient && editingIngredient) {
      res = await fetch('/admin/dashboard/api/ingredients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: editingIngredient._id, ...ingredientForm })
      });
    } else {
      res = await fetch('/admin/dashboard/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredientForm)
      });
    }
    if (res.ok) {
      if (isEditingIngredient && editingIngredient) {
        const editingId = editingIngredient._id;
        allIngredients = allIngredients.map(ing =>
          ing._id === editingId ? { ...ing, ...ingredientForm } : ing
        );
        toast.success('Ingrediens oppdatert!');
      } else {
        const { insertedId } = await res.json();
        allIngredients = [
          { ...ingredientForm, _id: insertedId },
          ...allIngredients
        ];
        toast.success('Ingrediens lagt til!');
      }
      closeIngredientModal();
    } else {
      ingredientError = 'Kunne ikke lagre ingrediens';
    }
  }

  async function deleteIngredient(ingredient: IngredientWithPrice) {
    if (!confirm(`Er du sikker på at du vil slette ingrediensen "${ingredient.name}"?`)) return;
    const res = await fetch('/admin/dashboard/api/ingredients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id: ingredient._id })
    });
    if (res.ok) {
      allIngredients = allIngredients.filter(ing => ing._id !== ingredient._id);
      toast.success('Ingrediens slettet!');
    } else {
      toast.error('Kunne ikke slette ingrediens');
    }
  }

  function openDeleteModal(target: Recipe | IngredientWithPrice, type: 'recipe' | 'ingredient') {
    deleteTarget = target;
    deleteType = type;
    deleteMessage = type === 'ingredient'
      ? `Er du sikker på at du vil slette ingrediensen "${(target as IngredientWithPrice).name}"?`
      : `Er du sikker på at du vil slette oppskriften "${(target as Recipe).title}"?`;
    showDeleteModal = true;
  }
  function closeDeleteModal() {
    showDeleteModal = false;
    deleteTarget = null;
    deleteType = 'recipe';
    deleteMessage = '';
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    
    if (deleteType === 'ingredient') {
      const target = deleteTarget as IngredientWithPrice;
      const res = await fetch('/admin/dashboard/api/ingredients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: target._id })
      });
      if (res.ok) {
        allIngredients = allIngredients.filter(ing => ing._id !== target._id);
        toast.success('Ingrediens slettet!');
      } else {
        toast.error('Kunne ikke slette ingrediens');
      }
    } else if (deleteType === 'recipe') {
      const target = deleteTarget as Recipe;
      let id: string = target._id || '';
      if (typeof id === 'object' && (id as any).$oid) id = (id as any).$oid;
      const res = await fetch(`/admin/dashboard/api/recipes/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        recipes = recipes.filter(r => r._id !== id);
        toast.success('Oppskrift slettet!');
      } else {
        toast.error('Kunne ikke slette oppskrift');
      }
    }
    closeDeleteModal();
  }



  function saveIngredientFromCard({ name, ean, done }: { name: string; ean: string; done?: () => void }) {
    // Reuse saveIngredient logic, but allow passing name/ean and optionally skip closing modal
    ingredientForm = { name, ean };
    ingredientError = '';
    isEditingIngredient = false;
    editingIngredient = null;
    showIngredientModal = true;
    // Optionally, you can handle 'done' callback if needed
  }

  function getIngredientName(ingredient: IngredientWithPrice): string {
    return ingredient.name;
  }
</script>

  <div class="min-h-screen w-full bg-gray-100 dark:bg-gray-900">


    {#if isLoading}
      <!-- Loading Spinner -->
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-4">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p class="text-lg text-gray-600 dark:text-gray-400">Laster admin dashboard...</p>
        </div>
      </div>
    {:else}
      <div class="w-full mt-8">
        <Tabs class="justify-center custom-tabs">
        <TabItem open={true} title="📖 Oppskrifter">
          <div class="max-h-[70vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-4 w-full">
            <div class="flex items-center mb-4 justify-between flex-row-reverse">
              <button
                class="flex items-center gap-2 border border-gray-300 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-900 dark:border-blue-400"
                on:click={() => goto('/admin/dashboard/recipes/new')}
                aria-label="Add new recipe"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span class="font-medium">Ny oppskrift</span>
              </button>
            </div>

            <!-- Recipe Search Bar -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Søk etter oppskrifter..."
                bind:value={recipeSearchTerm}
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {#if recipeSearchTerm}
                <button
                  on:click={clearRecipeSearch}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Tøm søk"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              {/if}
            </div>

            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Viser {filteredRecipes.length} av {recipes.length} oppskrifter
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500 mb-2">
              💡 Søk etter tittel, undertittel eller meal plan ID • Ctrl+F for hurtigsøk
            </div>

            <RecipesTable
              recipes={filteredRecipes}
              {allIngredients}
              showAdminActions={true}
              on:edit={(event) => {
                const recipe = event.detail;
                // Navigate to dedicated edit page using _id or title
                if (recipe._id) {
                  goto(`/admin/dashboard/recipes/${recipe._id}`);
                } else if (recipe.title) {
                  // Fallback: try to find by title if _id is not available
                  goto(`/admin/dashboard/recipes/${encodeURIComponent(recipe.title)}`);
                }
              }}
              on:delete={(event) => openDeleteModal(event.detail, 'recipe')}
              on:addIngredient={({ detail }) => saveIngredientFromCard(detail)}
              on:refresh={async () => {
                // Reload both recipes and ingredients data to get updated coverage percentages
                const response = await fetch('/admin/dashboard');
                if (response.ok) {
                  const data = await response.json();
                  recipes = data.recipes;
                  allIngredients = data.ingredients;
                }
              }}
            />
          </div>
        </TabItem>

        <TabItem title="🥕 Ingredienser">
          <div class="max-h-[70vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-4 w-full">
            <div class="flex items-center mb-4 justify-between flex-row-reverse">
              <button
                class="flex items-center gap-2 border border-gray-300 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-900 dark:border-blue-400"
                on:click={openNewIngredient}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span class="font-medium">Ny ingrediens</span>
              </button>
            </div>

            <!-- Ingredient Search Bar -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Søk etter ingredienser..."
                bind:value={ingredientSearchTerm}
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {#if ingredientSearchTerm}
                <button
                  on:click={clearIngredientSearch}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Tøm søk"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              {/if}
            </div>

            <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Viser {filteredIngredients.length} av {allIngredients.length} ingredienser
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500 mb-2">
              💡 Søk etter navn eller EAN-nummer • Ctrl+Shift+F for hurtigsøk
            </div>

            <IngredientsAlert ingredients={allIngredients} />


            <div class="mb-4 p-3 max-w-xl bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-400 rounded text-blue-900 dark:text-blue-100 text-sm">
              Ingredienser lagt til her vil hente pris og næringsinfo via <a href="https://kassal.app/" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-700">kassal.app</a>. Data oppdateres hver natt, og vil hentes så lenge EAN-nummeret er korrekt.
            </div>

            <IngredientsAdminTable
              ingredients={filteredIngredients}
              showAdminActions={true}
              on:edit={(event) => openEditIngredient(event.detail)}
              on:delete={(event) => openDeleteModal(event.detail, 'ingredient')}
            />
          </div>
        </TabItem>
      </Tabs>
    </div>
    {/if}
  </div>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overflow-y-auto py-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-6xl relative my-auto">
      <h3 class="text-xl font-bold mb-4">{isCreating ? 'Legg til ny oppskrift' : 'Rediger oppskrift'}</h3>
      {#if isCreating}
        <div class="flex justify-end mb-2">
          <button class="text-blue-600 underline text-sm" type="button" on:click={toggleInputMode}>
            {showRawJson ? 'Skjema' : 'JSON'}
          </button>
        </div>
        {#if showRawJson}
          <textarea class="w-full border rounded p-2 font-mono" rows="18" bind:value={jsonString}></textarea>
          {#if error}
            <div class="text-red-600 mt-2">{error}</div>
          {/if}
        {:else}
          <form on:submit|preventDefault={save} class="flex flex-col gap-4">
            <input class="hidden" type="text" value={formRecipe.recipeId} readonly />
            <div class="flex gap-4">
              <div class="flex-1">
                <label for="recipe-title" class="block text-sm font-medium mb-1">Tittel</label>
                <input id="recipe-title" class="w-full border rounded p-2" bind:value={formRecipe.title} required />
              </div>
              <div class="flex-1">
                <label for="recipe-subtitle" class="block text-sm font-medium mb-1">Undertittel</label>
                <input id="recipe-subtitle" class="w-full border rounded p-2" bind:value={formRecipe.subtitle} />
              </div>
            </div>
            <div class="flex gap-4">
              <div class="flex-1">
                <label for="recipe-prep-time" class="block text-sm font-medium mb-1">Forberedelsestid (min)</label>
                <input id="recipe-prep-time" class="w-full border rounded p-2" type="number" bind:value={formRecipe.prepTime} min="0" />
              </div>
              <div class="flex-1">
                <label for="recipe-portions" class="block text-sm font-medium mb-1">Porsjoner</label>
                <input id="recipe-portions" class="w-full border rounded p-2" type="number" bind:value={formRecipe.portions} min="0" />
              </div>
            </div>
            <div>
              <label for="recipe-meal-plan-id" class="block text-sm font-medium mb-1">Meal Plan ID</label>
              <input id="recipe-meal-plan-id" class="w-full border rounded p-2" bind:value={formRecipe.mealPlanId} />
            </div>
            <div>
              <label for="recipe-new-step" class="block text-sm font-medium mb-1">Steg</label>
              <div class="flex gap-2 mb-2">
                <input id="recipe-new-step" class="flex-1 border rounded p-2" placeholder="Nytt steg" bind:value={newStep} />
                <button type="button" class="bg-blue-600 text-white px-3 py-1 rounded" on:click={addStep}>Legg til</button>
              </div>
              <ul class="list-decimal ml-6">
                {#each formRecipe.steps as step, i}
                  <li class="flex items-center gap-2 mb-1">
                    <span>{step}</span>
                    <button type="button" class="text-red-600" on:click={() => removeStep(i)}>✕</button>
                  </li>
                {/each}
              </ul>
            </div>
            <div>
              <span class="block text-sm font-medium mb-1">Ingredienser</span>
              <div class="flex gap-2 mb-2">
                <!-- Custom Searchable Dropdown -->
                <div class="flex-1 relative ingredient-dropdown">
                  <div class="flex items-center border border-gray-300 dark:border-gray-600 rounded  bg-white dark:bg-gray-700 dark:text-white transition-all duration-200 {showIngredientDropdown ? 'ring-2 ring-blue-500 border-blue-500' : ''}">
                    <input
                      type="text"
                      placeholder={showIngredientDropdown ? "Skriv for å søke..." : "Søk etter ingrediens..."}
                      bind:value={dropdownIngredientSearch}
                      on:click={toggleIngredientDropdown}
                      on:focus={toggleIngredientDropdown}
                      class="flex-1 outline-none bg-transparent transition-colors duration-200"
                      readonly={!showIngredientDropdown}
                    />
                    {#if selectedIngredientId && !showIngredientDropdown}
                      <button
                        type="button"
                        on:click={clearIngredientSelection}
                        class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Tøm valg"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    {:else if !showIngredientDropdown}
                      <svg class="ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    {/if}
                  </div>

                  <!-- Dropdown Menu -->
                  {#if showIngredientDropdown}
                    <div class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <!-- Ingredient List -->
                      <div class="py-1">
                        {#if filteredDropdownIngredients.length === 0}
                          <div class="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                            Ingen ingredienser funnet
                          </div>
                        {:else}
                          {#each filteredDropdownIngredients as ingredient}
                            <button
                              type="button"
                              on:click={() => selectIngredient(ingredient)}
                              class="w-full text-left px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white text-sm"
                            >
                              {ingredient.name}
                            </button>
                          {/each}
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>

                <input class="w-24 border rounded" type="number" min="0" step="any" placeholder="Mengde" bind:value={newIngredient.amount} />
                <select class="w-28 border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" bind:value={newIngredient.measurement}>
                  <optgroup label="Stykker">
                    {#each ['stk', 'boks', 'pakke', 'båt', 'pk', 'potte'] as unit}
                      <option value={unit} selected={unit === 'stk'}>{unit}</option>
                    {/each}
                  </optgroup>
                  <optgroup label="Vekt">
                    {#each ['g', 'kg'] as unit}
                      <option value={unit}>{unit}</option>
                    {/each}
                  </optgroup>
                  <optgroup label="Volum">
                    {#each ['ml', 'l', 'dl', 'ss', 'ts'] as unit}
                      <option value={unit}>{unit}</option>
                    {/each}
                  </optgroup>
                  <optgroup label="Små mengder">
                    {#each ['klype', 'knivspiss'] as unit}
                      <option value={unit}>{unit}</option>
                    {/each}
                  </optgroup>
                </select>
                <button type="button" class="bg-blue-600 text-white px-3 py-1 rounded" on:click={addIngredient}>Legg til</button>
              </div>
              <ul class="ml-6">
                {#each formRecipe.recipeIngredients as ing, i}
                  <li class="flex items-center gap-2 mb-1">
                    <span>{getIngredientDisplay(ing)}</span>
                    <button type="button" class="text-red-600" on:click={() => removeIngredient(i)}>✕</button>
                  </li>
                {/each}
              </ul>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button class="bg-gray-400 text-white px-4 py-2 rounded" type="button" on:click={closeModal}>Avbryt</button>
              <button class="bg-green-600 text-white px-4 py-2 rounded" type="submit">Opprett</button>
            </div>
          </form>
        {/if}
      {:else}
        <!-- Editing existing recipe -->
        <div class="flex justify-end mb-2">
          <button class="text-blue-600 underline text-sm" type="button" on:click={toggleEditorMode}>
            {useVisualEditor ? 'JSON Editor' : 'Visual Editor'}
          </button>
        </div>
        {#if useVisualEditor && editingRecipe}
          <div class="max-h-[80vh] overflow-y-auto">
            <RecipeEditor
              recipe={editingRecipe}
              {allIngredients}
              on:save={handleRecipeEditorSave}
              on:cancel={handleRecipeEditorCancel}
            />
          </div>
        {:else if useVisualEditor}
          <p class="text-red-600">Ingen oppskrift valgt</p>
        {:else}
          <textarea class="w-full border rounded p-2 font-mono dark:bg-gray-700 dark:text-white" rows="18" bind:value={jsonString}></textarea>
          {#if error}
            <div class="text-red-600 mt-2">{error}</div>
          {/if}
          <div class="flex justify-end gap-2 mt-4">
            <button class="bg-gray-400 text-white px-4 py-2 rounded" on:click={closeModal}>Avbryt</button>
            <button class="bg-green-600 text-white px-4 py-2 rounded" on:click={save}>Lagre</button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

{#if showIngredientModal}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-4">{isEditingIngredient ? 'Rediger ingrediens' : 'Ny ingrediens'}</h3>
      <form on:submit|preventDefault={saveIngredient} class="flex flex-col gap-4">
        <div>
          <label for="ingredient-name" class="block text-sm font-medium mb-1">Navn</label>
          <input id="ingredient-name" class="w-full border rounded p-2" bind:value={ingredientForm.name} required />
        </div>
        <div>
          <label for="ingredient-ean" class="block text-sm font-medium mb-1">EAN</label>
          <input id="ingredient-ean" class="w-full border rounded p-2" bind:value={ingredientForm.ean} required />
        </div>
        {#if ingredientError}
          <div class="text-red-600 mt-2">{ingredientError}</div>
        {/if}
        <div class="flex justify-end gap-2 mt-4">
          <button class="bg-gray-400 text-white px-4 py-2 rounded" type="button" on:click={closeIngredientModal}>Avbryt</button>
          <button class="bg-green-600 text-white px-4 py-2 rounded" type="submit">Lagre</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showDeleteModal}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-4">Bekreft sletting</h3>
      <div class="mb-4 text-red-700 font-semibold">{deleteMessage}</div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="bg-gray-400 text-white px-4 py-2 rounded" type="button" on:click={closeDeleteModal}>Avbryt</button>
        <button class="bg-red-600 text-white px-4 py-2 rounded" type="button" on:click={confirmDelete}>Slett</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Custom tab styling for dark mode */
  @media (prefers-color-scheme: dark) {
    :global(.custom-tabs .tab-item) {
      background-color: rgb(31 41 55) !important; /* gray-800 */
      color: rgb(209 213 219) !important; /* gray-300 */
      border-color: rgb(75 85 99) !important; /* gray-600 */
    }

    :global(.custom-tabs .tab-item:hover) {
      background-color: rgb(55 65 81) !important; /* gray-700 */
      color: rgb(229 231 235) !important; /* gray-200 */
    }

    :global(.custom-tabs .tab-item.active) {
      background-color: rgb(37 99 235) !important; /* blue-600 */
      color: rgb(255 255 255) !important; /* white */
      border-color: rgb(37 99 235) !important; /* blue-600 */
    }

    :global(.custom-tabs .tab-item.active:hover) {
      background-color: rgb(29 78 216) !important; /* blue-700 */
      color: rgb(255 255 255) !important; /* white */
    }
  }
</style>
