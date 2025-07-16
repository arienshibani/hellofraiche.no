<script lang="ts">
  export let name: string = '';
  export let ean: string = '';
  export let error: string = '';
  export let open: boolean = false;
  import { createEventDispatcher } from 'svelte';
  import { validateEAN } from '$lib/util/validateEAN.js';
  const dispatch = createEventDispatcher();

  let localEAN = ean;
  let isBulkItem = false;
  $: if (open) {
    localEAN = ean;
    isBulkItem = false;
  }

  function handleSave() {
    if (isBulkItem) {
      dispatch('markBulkItem', { name });
      return;
    }
    if (!name || !localEAN) {
      dispatch('save', { name, ean: localEAN, error: 'Navn og EAN er påkrevd' });
      return;
    }
    if (!validateEAN(localEAN)) {
      dispatch('save', { name, ean: localEAN, error: 'Ugyldig EAN-nummer' });
      return;
    }
    dispatch('save', { name, ean: localEAN });
  }
  function handleClose() {
    dispatch('close');
  }
</script>

{#if open}
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
      <h3 class="text-xl font-bold mb-4 dark:text-white">Legg til ingrediens</h3>
      <form on:submit|preventDefault={handleSave} class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium mb-1 dark:text-gray-100">Navn</label>
          <input class="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" value={name} readonly />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 dark:text-gray-100">EAN</label>
          <input class="w-full border rounded p-2 dark:bg-gray-700 dark:text-white" bind:value={localEAN} required disabled={isBulkItem} />
        </div>
        <div class="flex items-center gap-2">
          <input id="bulkitem" type="checkbox" bind:checked={isBulkItem} />
          <label for="bulkitem" class="text-sm dark:text-gray-100">Dette er en bulkvare (skal ikke indekseres)</label>
        </div>
        {#if error}
          <div class="text-red-600 mt-2 dark:text-red-400">{error}</div>
        {/if}
        <div class="flex justify-end gap-2 mt-4">
          <button class="bg-gray-400 text-white px-4 py-2 rounded" type="button" on:click={handleClose}>Avbryt</button>
          <button class="bg-green-600 text-white px-4 py-2 rounded" type="submit">{isBulkItem ? 'Merk som bulkvare' : 'Lagre'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}