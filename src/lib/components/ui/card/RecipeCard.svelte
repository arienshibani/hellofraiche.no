<script lang="ts">
  export let recipe: any;
  export let showAdminActions: boolean = false;
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow p-4 flex items-center justify-between cursor-pointer group">
  <div>
    <div class="font-bold text-lg group-hover:text-blue-700 transition-colors dark:text-white">{recipe.title}</div>
    <div class="text-gray-600 dark:text-gray-300">{recipe.subtitle}</div>
  </div>
  {#if showAdminActions}
    <div class="flex gap-2">
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded dark:bg-blue-900" on:click={() => dispatch('edit', recipe)}>Rediger Oppskrift ✍️</button>
      <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded dark:bg-red-900" on:click={() => dispatch('delete', recipe)}>Slett Oppskrift 🗑️</button>
    </div>
  {/if}
</div> 