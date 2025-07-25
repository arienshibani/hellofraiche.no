<script lang="ts">
    import { Table, TableBody, TableBodyRow, TableBodyCell, TableHead, TableHeadCell } from "flowbite-svelte";
    import { createEventDispatcher } from 'svelte';
    import AddIngredientModal from '$lib/components/ui/modals/AddIngredientModal.svelte';
    import CoverageModal from '$lib/components/ui/modals/CoverageModal.svelte';

    // Props
    export let recipes: any[] = [];
    export let allIngredients: any[] = [];
    export let showAdminActions = false;

    const dispatch = createEventDispatcher();

    // Modal states
    let showCoverageModal = false;
    let showAddModal = false;
    let addName = '';
    let addEAN = '';
    let addError = '';
    let selectedRecipe: any = null;

    // Calculate coverage for a recipe
    function getCoverage(recipe: any) {
        if (!recipe.recipeIngredients || !Array.isArray(recipe.recipeIngredients)) return undefined;
        const filtered = recipe.recipeIngredients.filter((ri: any) => !ri.isBulkItem);
        const total = filtered.length;
        if (total === 0) return 100;
        const matched = filtered.filter((ri: any) => allIngredients.some(ai => ai.name === ri.name)).length;
        return Math.trunc((matched / total) * 100);
    }

    // Get coverage color
    function getCoverageColor(coverage: number | undefined) {
        if (coverage === undefined) return '';
        if (coverage >= 90) return 'text-green-600 dark:text-green-400';
        if (coverage >= 50) return 'text-orange-500 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    }

    // Modal functions
    function openCoverageModal(recipe: any) {
        selectedRecipe = recipe;
        showCoverageModal = true;
    }

    function closeCoverageModal() {
        showCoverageModal = false;
        selectedRecipe = null;
    }

    function openAddModal(name: string) {
        addName = name;
        addEAN = '';
        addError = '';
        showAddModal = true;
    }

    function closeAddModal() {
        showAddModal = false;
    }

    function handleAddIngredient({ detail }: { detail: any }) {
        if (!detail.name || !detail.ean) {
            addError = 'Navn og EAN er påkrevd';
            return;
        }
        addError = '';
        dispatch('addIngredient', { name: detail.name, ean: detail.ean });
        
        // Also update the recipe's ingredient with the EAN
        fetch(`/admin/dashboard/api/recipes/${selectedRecipe._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                updateEAN: { 
                    name: detail.name, 
                    ean: detail.ean 
                } 
            })
        }).then(() => {
            // Refresh to show updated recipe with EAN
            dispatch('refresh');
        });
    }

    function handleCoverageAdd({ detail }: { detail: any }) {
        openAddModal(detail.name);
    }

    async function handleCoverageAddBulk({ detail }: { detail: { name: string } }) {
        try {
            const response = await fetch(`/admin/dashboard/api/recipes/${selectedRecipe._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markBulk: detail.name })
            });
            
            if (response.ok) {
                dispatch('refresh');
                closeCoverageModal();
            } else {
                console.error('Failed to mark ingredient as bulk');
            }
        } catch (error) {
            console.error('Error marking ingredient as bulk:', error);
        }
    }
</script>

<div class="overflow-x-auto">
    <Table class="w-full border-0">
        <TableHead>
            <TableHeadCell class="border-0">Tittel</TableHeadCell>
            <TableHeadCell class="border-0">Undertittel</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Forberedelsestid</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Porsjoner</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Ingredienser</TableHeadCell>
            <TableHeadCell class="border-0 text-center">Dekning</TableHeadCell>
            {#if showAdminActions}
                <TableHeadCell class="border-0 text-center">Handlinger</TableHeadCell>
            {/if}
        </TableHead>
        <TableBody>
            {#each recipes as recipe}
                {@const coverage = getCoverage(recipe)}
                {@const coverageColor = getCoverageColor(coverage)}
                {@const ingredientCount = recipe.recipeIngredients ? recipe.recipeIngredients.length : 0}
                <TableBodyRow class="hover:bg-gray-50 dark:hover:bg-gray-700 border-0">
                    <TableBodyCell class="font-medium dark:text-white border-0">
                        <a 
                            href="/recipes/{recipe.title}" 
                            class="font-bold text-lg hover:text-blue-700 transition-colors dark:text-white hover:underline cursor-pointer"
                            title="Se oppskrift"
                        >
                            {recipe.title}
                        </a>
                    </TableBodyCell>
                    <TableBodyCell class="text-gray-600 dark:text-gray-300 border-0">
                        {recipe.subtitle || '-'}
                    </TableBodyCell>
                    <TableBodyCell class="text-center dark:text-gray-200 border-0">
                        {recipe.prepTime ? `${recipe.prepTime} min` : '-'}
                    </TableBodyCell>
                    <TableBodyCell class="text-center dark:text-gray-200 border-0">
                        {recipe.portions || '-'}
                    </TableBodyCell>
                    <TableBodyCell class="text-center dark:text-gray-200 border-0">
                        {ingredientCount} ingredienser
                    </TableBodyCell>
                    <TableBodyCell class="text-center border-0">
                        {#if coverage !== undefined}
                            <button 
                                class="font-semibold {coverageColor} hover:underline cursor-pointer"
                                on:click={() => openCoverageModal(recipe)}
                                title="Klikk for å se detaljer"
                            >
                                {coverage}%
                            </button>
                        {:else}
                            <span class="text-gray-400">-</span>
                        {/if}
                    </TableBodyCell>
                    {#if showAdminActions}
                        <TableBodyCell class="text-center border-0">
                            <div class="flex gap-2 justify-center">
                                <button 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm dark:bg-blue-900 transition-colors"
                                    on:click={() => dispatch('edit', recipe)}
                                    title="Rediger oppskrift"
                                >
                                    ✍️
                                </button>
                                <button 
                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm dark:bg-red-900 transition-colors"
                                    on:click={() => dispatch('delete', recipe)}
                                    title="Slett oppskrift"
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

<!-- Coverage Modal -->
{#if showCoverageModal && selectedRecipe}
    <CoverageModal 
        {selectedRecipe}
        {allIngredients}
        on:close={closeCoverageModal}
        on:addIngredient={handleCoverageAdd}
        on:addBulk={handleCoverageAddBulk}
    />
{/if}

<!-- Add Ingredient Modal -->
{#if showAddModal}
    <AddIngredientModal 
        name={addName}
        on:close={closeAddModal}
        on:addIngredient={handleAddIngredient}
    />
{/if} 