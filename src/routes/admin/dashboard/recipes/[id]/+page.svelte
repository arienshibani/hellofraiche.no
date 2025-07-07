<script>
  export let data;
  let recipe = data.recipe;
  let jsonString = JSON.stringify(recipe, null, 2);
  let error = '';

  async function save() {
    try {
      const updated = JSON.parse(jsonString);
      const res = await fetch(`/admin/dashboard/api/recipes/${recipe._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        alert('Saved!');
        error = '';
      } else {
        error = 'Error saving';
      }
    } catch (e) {
      error = 'Invalid JSON: ' + e.message;
    }
  }
</script>

<h2 class="text-2xl font-bold mt-8 mb-4">Edit Recipe JSON</h2>
<textarea class="w-full border rounded p-2 font-mono" rows="20" bind:value={jsonString}></textarea>
{#if error}
  <div class="text-red-600 mt-2">{error}</div>
{/if}
<button class="bg-green-600 text-white px-4 py-2 rounded mt-4" on:click={save}>Save</button> 