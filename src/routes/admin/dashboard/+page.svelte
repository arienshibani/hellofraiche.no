<script>
  import { onMount } from 'svelte';
  import toast from 'svelte-french-toast';
  import { nanoid } from 'nanoid';
  export let data;
  let recipes = data.recipes;
  let allIngredients = data.ingredients || [];

  let showModal = false;
  // @ts-ignore
  let editingRecipe = null;
  let jsonString = '';
  let error = '';
  let isCreating = false;
  let showRawJson = false;

  // Form state for new recipe
  let formRecipe = {
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
  let newIngredient = { name: '', amount: 0, measurement: '' };
  let selectedIngredientId = '';

  // Ingredient modal state
  let showIngredientModal = false;
  let isEditingIngredient = false;
  let editingIngredient = null;
  let ingredientForm = { name: '', ean: '' };
  let ingredientError = '';

  // Collapsible state
  let showRecipes = false;
  let showIngredients = false;

  // Deletion modal state
  let showDeleteModal = false;
  let deleteTarget = null;
  let deleteType = '';
  let deleteMessage = '';

  function openModal(recipe) {
    editingRecipe = recipe;
    jsonString = JSON.stringify(recipe, null, 2);
    error = '';
    showModal = true;
    isCreating = false;
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
    error = '';
    showModal = true;
    isCreating = true;
    showRawJson = false;
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
  function removeStep(idx) {
    formRecipe.steps = formRecipe.steps.filter((_, i) => i !== idx);
  }

  function addIngredient() {
    if (selectedIngredientId && newIngredient.amount > 0 && newIngredient.measurement.trim()) {
      const ingredientObj = allIngredients.find(i => i._id === selectedIngredientId);
      if (ingredientObj) {
        formRecipe.recipeIngredients = [
          ...formRecipe.recipeIngredients,
          {
            ...ingredientObj,
            name: ingredientObj.name, // for clarity
            amount: newIngredient.amount,
            measurement: newIngredient.measurement
          }
        ];
        newIngredient = { name: '', amount: 0, measurement: '' };
        selectedIngredientId = '';
      }
    }
  }
  function removeIngredient(idx) {
    formRecipe.recipeIngredients = formRecipe.recipeIngredients.filter((_, i) => i !== idx);
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
        if (res.ok) {
          toast.success(`Oppdatert oppskrift: ${updated.title || editingRecipe.title || 'Untitled Recipe'}`);
          // @ts-ignore
          recipes = recipes.map(r =>
            // @ts-ignore
            r._id === editingRecipe._id ? { ...r, ...updated, _id: editingRecipe._id } : r
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
  function handleKeydown(event) {
    if (showModal && event.key === 'Escape') {
      closeModal();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function openEditIngredient(ingredient) {
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
    let res;
    if (isEditingIngredient) {
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
      if (isEditingIngredient) {
        allIngredients = allIngredients.map(ing =>
          ing._id === editingIngredient._id ? { ...ing, ...ingredientForm } : ing
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

  async function deleteIngredient(ingredient) {
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

  function openDeleteModal(target, type) {
    deleteTarget = target;
    deleteType = type;
    deleteMessage = type === 'ingredient'
      ? `Er du sikker på at du vil slette ingrediensen "${target.name}"?`
      : `Er du sikker på at du vil slette oppskriften "${target.title}"?`;
    showDeleteModal = true;
  }
  function closeDeleteModal() {
    showDeleteModal = false;
    deleteTarget = null;
    deleteType = '';
    deleteMessage = '';
  }
  async function confirmDelete() {
    if (deleteType === 'ingredient') {
      const res = await fetch('/admin/dashboard/api/ingredients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: deleteTarget._id })
      });
      if (res.ok) {
        allIngredients = allIngredients.filter(ing => ing._id !== deleteTarget._id);
        toast.success('Ingrediens slettet!');
      } else {
        toast.error('Kunne ikke slette ingrediens');
      }
    } else if (deleteType === 'recipe') {
      let id = deleteTarget._id;
      if (typeof id === 'object' && id.$oid) id = id.$oid;
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
</script>

<div class="flex flex-col items-center w-full dark:bg-gray-900 dark:text-white">
  <div class="flex items-center w-full max-w-2xl mt-8 mb-4">
    <h2 class="text-2xl font-bold flex-1 dark:text-white">Admin Dashboard</h2>
  </div>
  <!-- Recipes Collapsible -->
  <div class="w-full  mt-8 mb-4">
    <button class="w-full flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-t-lg font-bold text-lg dark:text-white" on:click={() => showRecipes = !showRecipes}>
      <span>Oppskrifter</span>
      <span>{showRecipes ? '▲' : '▼'}</span>
    </button>
    {#if showRecipes}
      <div class="max-h-[70vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-b-lg shadow p-4 flex flex-col gap-4 w-full">
        <div class="flex items-center mb-4 justify-between flex-row-reverse">
          <button
            class="flex items-center gap-2 border border-gray-300 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-900 dark:border-blue-400"
            on:click={openCreateModal}
            aria-label="Add new recipe"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span class="font-medium">Ny oppskrift</span>
          </button>
        </div>
        {#each recipes as recipe}
          <div class="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex items-center justify-between cursor-pointer group">
            <div>
              <div class="font-bold text-lg group-hover:text-blue-700 transition-colors dark:text-white">{recipe.title}</div>
              <div class="text-gray-600 dark:text-gray-300">{recipe.subtitle}</div>
            </div>
            <div class="flex gap-2">
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded dark:bg-blue-900" on:click={() => openModal(recipe)}>Rediger Oppskrift ✍️</button>
              <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded dark:bg-red-900" on:click={() => openDeleteModal(recipe, 'recipe')}>Slett Oppskrift 🗑️</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <!-- Ingredient Collapsible -->
  <div class="w-full max-w-1xl mt-8">
    <button class="w-full flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-t-lg font-bold text-lg dark:text-white" on:click={() => showIngredients = !showIngredients}>
      <span>Ingredienser</span>
      <span>{showIngredients ? '▲' : '▼'}</span>
    </button>
    {#if showIngredients}
      <div class="max-h-[70vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-b-lg shadow p-4 flex flex-col gap-4 w-full">
        <div class="flex items-center mb-4 justify-between flex-row-reverse">
          <button
            class="flex items-center gap-2 border border-gray-300 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-900 dark:border-blue-400"
            on:click={openNewIngredient}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span class="font-medium">Ny ingrediens</span>
          </button>
        </div>
        <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-400 rounded text-blue-900 dark:text-blue-100 text-sm">
          Ingredienser lagt til her vil hente pris og næringsinfo via <a href="https://kassal.app/" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-700">kassal.app</a>. Data oppdateres hver natt, og vil hentes så lenge EAN-nummeret er korrekt.
        </div>
        {#each allIngredients as ingredient (ingredient._id)}
          <div class="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow transition-opacity min-h-[100px] p-4 flex flex-col">
            <div class="flex items-center justify-between">
              <div class="font-bold text-lg dark:text-white">{ingredient.name}</div>
              <div class="flex gap-2">
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm dark:bg-blue-900" on:click={() => openEditIngredient(ingredient)}>Rediger ingrediens ✍️</button>
                <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm dark:bg-red-900" on:click={() => openDeleteModal(ingredient, 'ingredient')}>Slett 🗑️</button>
              </div>
            </div>
            <div class="text-gray-600 dark:text-gray-300 text-sm">
              EAN: {ingredient.ean || 'N/A'}
              {#if ingredient.data && ingredient.data.products && ingredient.data.products.length > 0}
                {#each [ingredient.data.products[0]] as product}
                  <br />
                  Pris: {product.current_price?.price ? Number(product.current_price.price).toFixed(2) + ' kr' : 'N/A'}
                  {#if product.current_price?.unit_price}
                    &nbsp;|&nbsp; Pris per enhet: {Number(product.current_price.unit_price).toFixed(2)} kr/{product.weight_unit || 'enhet'}
                  {/if}
                  {#if product.weight}
                    &nbsp;|&nbsp; Vekt: {product.weight}{product.weight_unit}
                  {/if}
                  {#if product.url}
                    <br />
                    <a href={product.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline flex items-center gap-1 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 3h7m0 0v7m0-7L10 14m-4 0h7m-7 0v7m0-7L14 3" /></svg>
                      Produktlink
                    </a>
                  {/if}
                {/each}
              {:else}
                <br />Pris: N/A
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
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
                <label class="block text-sm font-medium mb-1">Tittel</label>
                <input class="w-full border rounded p-2" bind:value={formRecipe.title} required />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Undertittel</label>
                <input class="w-full border rounded p-2" bind:value={formRecipe.subtitle} />
              </div>
            </div>
            <div class="flex gap-4">
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Forberedelsestid (min)</label>
                <input class="w-full border rounded p-2" type="number" bind:value={formRecipe.prepTime} min="0" />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium mb-1">Porsjoner</label>
                <input class="w-full border rounded p-2" type="number" bind:value={formRecipe.portions} min="0" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Meal Plan ID</label>
              <input class="w-full border rounded p-2" bind:value={formRecipe.mealPlanId} />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Steg</label>
              <div class="flex gap-2 mb-2">
                <input class="flex-1 border rounded p-2" placeholder="Nytt steg" bind:value={newStep} />
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
              <label class="block text-sm font-medium mb-1">Ingredienser</label>
              <div class="flex gap-2 mb-2">
                <select class="flex-1 border rounded p-2" bind:value={selectedIngredientId}>
                  <option value="">Velg ingrediens</option>
                  {#each allIngredients as ingredient}
                    <option value={ingredient._id}>{ingredient.name}</option>
                  {/each}
                </select>
                <input class="w-24 border rounded p-2" type="number" min="0" step="any" placeholder="Mengde" bind:value={newIngredient.amount} />
                <input class="w-24 border rounded p-2" placeholder="Måleenhet" bind:value={newIngredient.measurement} />
                <button type="button" class="bg-blue-600 text-white px-3 py-1 rounded" on:click={addIngredient}>Legg til</button>
              </div>
              <ul class="ml-6">
                {#each formRecipe.recipeIngredients as ing, i}
                  <li class="flex items-center gap-2 mb-1">
                    <span>{ing.name} ({ing.amount} {ing.measurement})</span>
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
        <textarea class="w-full border rounded p-2 font-mono" rows="18" bind:value={jsonString}></textarea>
        {#if error}
          <div class="text-red-600 mt-2">{error}</div>
        {/if}
        <div class="flex justify-end gap-2 mt-4">
          <button class="bg-gray-400 text-white px-4 py-2 rounded" on:click={closeModal}>Cancel</button>
          <button class="bg-green-600 text-white px-4 py-2 rounded" on:click={save}>Lagre</button>
        </div>
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
          <label class="block text-sm font-medium mb-1">Navn</label>
          <input class="w-full border rounded p-2" bind:value={ingredientForm.name} required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">EAN</label>
          <input class="w-full border rounded p-2" bind:value={ingredientForm.ean} required />
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
