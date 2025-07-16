<script lang="ts">
  export let ingredient: any;
  export let showAdminActions: boolean = false;
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow transition-opacity min-h-[100px] p-4 flex flex-col">
  <div class="flex items-center justify-between">
    <div class="font-bold text-lg dark:text-white">{ingredient.name}</div>
    {#if showAdminActions}
      <div class="flex gap-2">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm dark:bg-blue-900" on:click={() => dispatch('edit', ingredient)}>Rediger ingrediens ✍️</button>
        <button class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm dark:bg-red-900" on:click={() => dispatch('delete', ingredient)}>Slett 🗑️</button>
      </div>
    {/if}
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