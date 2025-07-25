<script lang="ts">
    import { Table, TableBody, TableBodyRow, TableBodyCell, TableHead, TableHeadCell } from "flowbite-svelte";
    import { createEventDispatcher } from 'svelte';

    // Props
    export let ingredients: any[] = [];
    export let showAdminActions = false;

    const dispatch = createEventDispatcher();

    // Get the best price from products
    function getBestPrice(ingredient: any) {
        if (!ingredient.data || !ingredient.data.products || ingredient.data.products.length === 0) {
            return null;
        }

        // Find Meny product first, then any other product
        const menyProduct = ingredient.data.products.find((product: any) =>
            product.store && product.store.name === 'Meny'
        );

        const product = menyProduct || ingredient.data.products[0];
        return product?.current_price?.price || null;
    }

    // Get product URL
    function getProductUrl(ingredient: any) {
        if (!ingredient.data || !ingredient.data.products || ingredient.data.products.length === 0) {
            return null;
        }

        const menyProduct = ingredient.data.products.find((product: any) =>
            product.store && product.store.name === 'Meny'
        );

        const product = menyProduct || ingredient.data.products[0];
        return product?.url || null;
    }

    // Get store name
    function getStoreName(ingredient: any) {
        if (!ingredient.data || !ingredient.data.products || ingredient.data.products.length === 0) {
            return null;
        }

        const menyProduct = ingredient.data.products.find((product: any) =>
            product.store && product.store.name === 'Meny'
        );

        const product = menyProduct || ingredient.data.products[0];
        return product?.store?.name || null;
    }
</script>

<div class="overflow-x-auto">
    <Table class="w-full border-0">
        <TableHead>
            <TableHeadCell class="border-0">Navn</TableHeadCell>
            <TableHeadCell class="border-0">EAN</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Butikk</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Pris</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Link</TableHeadCell>
            {#if showAdminActions}
                <TableHeadCell class="border-0 text-center">Handlinger</TableHeadCell>
            {/if}
        </TableHead>
        <TableBody>
            {#each ingredients.sort((a, b) => {
                const aHasPrice = getBestPrice(a) !== null;
                const bHasPrice = getBestPrice(b) !== null;
                if (aHasPrice && !bHasPrice) return 1;  // a has price, b doesn't - b comes first
                if (!aHasPrice && bHasPrice) return -1; // a doesn't have price, b does - a comes first
                return 0; // both have same price status, maintain original order
            }) as ingredient}
                {@const price = getBestPrice(ingredient)}
                {@const url = getProductUrl(ingredient)}
                {@const storeName = getStoreName(ingredient)}
                <TableBodyRow class="hover:bg-gray-50 dark:hover:bg-gray-700 border-0">
                    <TableBodyCell class="font-medium dark:text-white border-0">
                        <div class="font-bold text-lg dark:text-white">
                            {ingredient.name}
                        </div>
                    </TableBodyCell>
                    <TableBodyCell class="text-gray-600 dark:text-gray-300 border-0 font-mono text-sm">
                        {ingredient.ean || 'N/A'}
                    </TableBodyCell>
                    <TableBodyCell class="text-center dark:text-gray-200 border-0">
                        {#if storeName}
                            <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                {storeName}
                            </span>
                        {:else}
                            <span class="text-gray-400">-</span>
                        {/if}
                    </TableBodyCell>
                    <TableBodyCell class="text-center dark:text-gray-200 border-0">
                        {#if price}
                            <span class="font-semibold text-green-600 dark:text-green-400">
                                {price.toFixed(2)} kr
                            </span>
                        {:else}
                            <span class="text-gray-400">N/A</span>
                        {/if}
                    </TableBodyCell>
                    <TableBodyCell class="text-center border-0">
                        {#if url}
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer" 
                                class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                title="Åpne produktlink"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        {:else}
                            <span class="text-gray-400">-</span>
                        {/if}
                    </TableBodyCell>
                    {#if showAdminActions}
                        <TableBodyCell class="text-center border-0">
                            <div class="flex gap-2 justify-center">
                                <button
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm dark:bg-blue-900 transition-colors"
                                    on:click={() => dispatch('edit', ingredient)}
                                    title="Rediger ingrediens"
                                >
                                    ✍️
                                </button>
                                <button
                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm dark:bg-red-900 transition-colors"
                                    on:click={() => dispatch('delete', ingredient)}
                                    title="Slett ingrediens"
                                >
                                    🗑️
                                </button>
                            </div>
                        </TableBodyCell>
                    {/if}
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>