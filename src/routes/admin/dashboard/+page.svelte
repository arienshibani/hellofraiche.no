<script>
  import { onMount } from 'svelte';
  export let data;
  let recipes = data.recipes;

  let showModal = false;
  // @ts-ignore
  let editingRecipe = null;
  let jsonString = '';
  let error = '';
  let isCreating = false;

  // @ts-ignore
  function openModal(recipe) {
    editingRecipe = recipe;
    jsonString = JSON.stringify(recipe, null, 2);
    error = '';
    showModal = true;
    isCreating = false;
  }

  function openCreateModal() {
    editingRecipe = null;
    jsonString = JSON.stringify({ title: '', subtitle: '', /* add other default fields if needed */ }, null, 2);
    error = '';
    showModal = true;
    isCreating = true;
  }

  function closeModal() {
    showModal = false;
    editingRecipe = null;
    jsonString = '';
    error = '';
    isCreating = false;
  }

  async function save() {
    try {
      const updated = JSON.parse(jsonString);
      let res;
      if (isCreating) {
        res = await fetch(`/admin/dashboard/api/recipes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } else {
        // @ts-ignore
        res = await fetch(`/admin/dashboard/api/recipes/${editingRecipe._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      }
      if (res.ok) {
        alert(isCreating ? 'Created!' : 'Saved!');
        closeModal();
        location.reload();
      } else {
        error = 'Error saving';
      }
    } catch (e) {
      error = 'Invalid JSON: ' + (e instanceof Error ? e.message : e);
    }
  }

  // @ts-ignore
  async function deleteRecipe(recipe) {

    console.log(recipe)

    let id = recipe._id;
    if (typeof id === 'object' && id.$oid) id = id.$oid;
    console.log('Client-side delete, id:', id, 'raw _id:', recipe._id);
    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) return;
    const res = await fetch(`/admin/dashboard/api/recipes/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      alert('Deleted!');
      location.reload();
    } else {
      let msg = 'Error deleting';
      try {
        const data = await res.json();
        if (data && data.error) msg += `: ${data.error}`;
      } catch (e) {
        msg += ' (no error details)';
      }
      console.error('Delete failed', res.status, res.statusText, await res.text());
      alert(msg);
    }
  }
</script>

<h2 class="text-2xl font-bold mt-8 mb-4">Admin Dashboard</h2>
<div class="flex items-center mb-4">
  <button
    class="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-full px-4 py-2 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
    on:click={openCreateModal}
    aria-label="Add new recipe"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
    <span class="font-medium">New Recipe</span>
  </button>
</div>
<div class="max-h-[70vh] overflow-y-auto bg-gray-50 rounded-lg shadow p-4 flex flex-col gap-4">
  {#each recipes as recipe}
    <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex items-center justify-between cursor-pointer group">
      <div>
        <div class="font-bold text-lg group-hover:text-blue-700 transition-colors">{recipe.title}</div>
        <div class="text-gray-600">{recipe.subtitle}</div>
      </div>
      <div class="flex gap-2">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" on:click={() => openModal(recipe)}>Edit</button>
        <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded" on:click={() => deleteRecipe(recipe)}>Delete</button>
      </div>
    </div>
  {/each}
</div>

{#if showModal}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
      <h3 class="text-xl font-bold mb-4">{isCreating ? 'Create New Recipe' : 'Edit Recipe JSON'}</h3>
      <textarea class="w-full border rounded p-2 font-mono" rows="18" bind:value={jsonString}></textarea>
      {#if error}
        <div class="text-red-600 mt-2">{error}</div>
      {/if}
      <div class="flex justify-end gap-2 mt-4">
        <button class="bg-gray-400 text-white px-4 py-2 rounded" on:click={closeModal}>Cancel</button>
        <button class="bg-green-600 text-white px-4 py-2 rounded" on:click={save}>{isCreating ? 'Create' : 'Save'}</button>
      </div>
    </div>
  </div>
{/if}
