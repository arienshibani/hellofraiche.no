<script lang="ts">
    import { Table, TableBody, TableBodyRow, TableBodyCell, TableHead, TableHeadCell } from "flowbite-svelte";
    import { createEventDispatcher } from 'svelte';
    import AddIngredientModal from '$lib/components/ui/modals/AddIngredientModal.svelte';
    import CoverageModal from '$lib/components/ui/modals/CoverageModal.svelte';
    import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-svelte';

    // Props
    export let recipes: any[] = [];
    export let allIngredients: any[] = [];
    export let showAdminActions = false;

    const dispatch = createEventDispatcher();

    // Sorting state
    type SortField = 'title' | 'prepTime' | 'portions' | 'ingredients' | 'coverage' | null;
    type SortDirection = 'asc' | 'desc' | null;
    let sortBy: SortField = null;
    let sortDirection: SortDirection = null;

    // Modal states
    let showCoverageModal = false;
    let showAddModal = false;
    let addName = '';
    let addEAN = '';
    let addError = '';
    let selectedRecipe: any = null;

    // Check if ingredient has valid price data
    function hasPriceData(ingredientName: string): boolean {
        const ingredient = allIngredients.find((ai: any) => ai.name === ingredientName);
        if (!ingredient) return false;
        if (!ingredient.ean) return false;
        // The API response is nested: data.data.products (not data.products)
        const products = ingredient.data?.data?.products || ingredient.data?.products;
        if (!ingredient.data || !products || !Array.isArray(products)) return false;
        return products.some((product: any) => 
            product.current_price && product.current_price.price && product.current_price.price > 0
        );
    }

    // Calculate coverage for a recipe - now checks for price data
    function getCoverage(recipe: any) {
        if (!recipe.recipeIngredients || !Array.isArray(recipe.recipeIngredients)) return undefined;
        const filtered = recipe.recipeIngredients.filter((ri: any) => !ri.isBulkItem);
        const total = filtered.length;
        if (total === 0) return 100;
        const matched = filtered.filter((ri: any) => hasPriceData(ri.name)).length;
        return Math.trunc((matched / total) * 100);
    }

    // Handle column header click for sorting
    function handleSort(field: SortField) {
        if (sortBy === field) {
            if (sortDirection === 'asc') {
                sortDirection = 'desc';
            } else if (sortDirection === 'desc') {
                sortBy = null;
                sortDirection = null;
            }
        } else {
            sortBy = field;
            sortDirection = 'asc';
        }
    }

    // Get sort icon for a column
    function getSortIcon(field: SortField) {
        if (sortBy !== field) return null;
        return sortDirection === 'asc' ? ArrowUp : ArrowDown;
    }

    // Sort recipes based on current sort state
    $: sortedRecipes = sortBy ? [...recipes].sort((a: any, b: any) => {
        let aVal: any;
        let bVal: any;

        switch (sortBy) {
            case 'title':
                aVal = (a.title || '').toLowerCase();
                bVal = (b.title || '').toLowerCase();
                break;
            case 'prepTime':
                aVal = a.prepTime || 0;
                bVal = b.prepTime || 0;
                break;
            case 'portions':
                aVal = a.portions || 0;
                bVal = b.portions || 0;
                break;
            case 'ingredients':
                aVal = a.recipeIngredients ? a.recipeIngredients.length : 0;
                bVal = b.recipeIngredients ? b.recipeIngredients.length : 0;
                break;
            case 'coverage':
                aVal = getCoverage(a) ?? 0;
                bVal = getCoverage(b) ?? 0;
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    }) : recipes;

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

    async function handleAddIngredient(event: { detail: any }) {
        const detail = event.detail;
        
        // Handle bulk item marking
        if (detail.name && !detail.ean) {
            // This is a bulk item - mark it in the recipe
            if (selectedRecipe?._id) {
                try {
                    const response = await fetch(`/admin/dashboard/api/recipes/${selectedRecipe._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ markBulk: detail.name })
                    });
                    if (response.ok) {
                        closeAddModal();
                        dispatch('refresh');
                    }
                } catch (error) {
                    addError = 'Feil ved markering som bulkvare';
                }
            }
            return;
        }
        
        if (!detail.name || !detail.ean) {
            addError = detail.error || 'Navn og EAN er påkrevd';
            return;
        }
        
        if (detail.error) {
            addError = detail.error;
            return;
        }
        
        addError = '';
        
        try {
            // First, create the ingredient in the database
            const createResponse = await fetch('/admin/dashboard/api/ingredients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: detail.name, ean: detail.ean })
            });

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                addError = errorData.error || 'Kunne ikke opprette ingrediens';
                return;
            }

            // Close the modal
            closeAddModal();

            // Refresh to show updated data (ingredient will now appear in allIngredients)
            dispatch('refresh');
        } catch (error: any) {
            addError = error.message || 'Feil ved oppretting av ingrediens';
            console.error('Error creating ingredient:', error);
        }
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
            <TableHeadCell 
                class="border-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                on:click={() => handleSort('title')}
            >
                <div class="flex items-center gap-2">
                    Tittel
                    {#if getSortIcon('title')}
                        {@const Icon = getSortIcon('title')}
                        <Icon size={16} class="text-gray-500" />
                    {/if}
                </div>
            </TableHeadCell>
            <TableHeadCell 
                class="border-0 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                on:click={() => handleSort('prepTime')}
            >
                <div class="flex items-center justify-center gap-2">
                    Forberedelsestid
                    {#if getSortIcon('prepTime')}
                        {@const Icon = getSortIcon('prepTime')}
                        <Icon size={16} class="text-gray-500" />
                    {/if}
                </div>
            </TableHeadCell>
            <TableHeadCell 
                class="border-0 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                on:click={() => handleSort('portions')}
            >
                <div class="flex items-center justify-center gap-2">
                    Porsjoner
                    {#if getSortIcon('portions')}
                        {@const Icon = getSortIcon('portions')}
                        <Icon size={16} class="text-gray-500" />
                    {/if}
                </div>
            </TableHeadCell>
            <TableHeadCell 
                class="border-0 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                on:click={() => handleSort('ingredients')}
            >
                <div class="flex items-center justify-center gap-2">
                    Ingredienser
                    {#if getSortIcon('ingredients')}
                        {@const Icon = getSortIcon('ingredients')}
                        <Icon size={16} class="text-gray-500" />
                    {/if}
                </div>
            </TableHeadCell>
            <TableHeadCell 
                class="border-0 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                on:click={() => handleSort('coverage')}
            >
                <div class="flex items-center justify-center gap-2">
                    Dekning
                    {#if getSortIcon('coverage')}
                        {@const Icon = getSortIcon('coverage')}
                        <Icon size={16} class="text-gray-500" />
                    {/if}
                </div>
            </TableHeadCell>
            {#if showAdminActions}
                <TableHeadCell class="border-0 text-center">Status</TableHeadCell>
                <TableHeadCell class="border-0 text-center">Handlinger</TableHeadCell>
            {/if}
        </TableHead>
        <TableBody>
            {#each sortedRecipes as recipe}
                {@const coverage = getCoverage(recipe)}
                {@const coverageColor = getCoverageColor(coverage)}
                {@const ingredientCount = recipe.recipeIngredients ? recipe.recipeIngredients.length : 0}
                <TableBodyRow class="hover:bg-gray-50 dark:hover:bg-gray-700 border-0">
                    <TableBodyCell class="font-medium dark:text-white border-0">
                        <a
                            href="/recipes/{encodeURIComponent(recipe.title)}"
                            class="font-bold text-lg hover:text-blue-700 dark:hover:text-blue-400 transition-colors dark:text-white hover:underline cursor-pointer"
                            title="Se oppskrift"
                        >
                            {recipe.title}
                        </a>
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
                            <div class="flex items-center justify-center gap-1.5">
                                <button
                                    class="font-semibold {coverageColor} hover:underline cursor-pointer"
                                    on:click={() => openCoverageModal(recipe)}
                                    title="Klikk for å se detaljer"
                                >
                                    {coverage}%
                                </button>
                                {#if !recipe.recipeImage || recipe.recipeImage.trim() === ''}
                                    <div class="relative group">
                                        <AlertTriangle 
                                            size={16} 
                                            class="text-yellow-500 dark:text-yellow-400 cursor-help" 
                                        />
                                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            Oppskriften mangler bilde
                                            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                <div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <span class="text-gray-400">-</span>
                        {/if}
                    </TableBodyCell>
                    {#if showAdminActions}
                        <TableBodyCell class="text-center border-0">
                            <span class={recipe.utkast ? "px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" : "px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}>
                                {recipe.utkast ? 'Utkast 📝' : 'Publisert ✅'}
                            </span>
                        </TableBodyCell>
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
                                    class={recipe.utkast ? "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm dark:bg-green-900 transition-colors" : "bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm dark:bg-yellow-900 transition-colors"}
                                    on:click={async () => {
                                        try {
                                            const response = await fetch(`/admin/dashboard/api/recipes/${recipe._id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ toggleUtkast: !recipe.utkast })
                                            });
                                            if (response.ok) {
                                                dispatch('refresh');
                                            }
                                        } catch (error) {
                                            console.error('Error toggling draft status:', error);
                                        }
                                    }}
                                    title={recipe.utkast ? "Publiser oppskrift" : "Sett som utkast"}
                                >
                                    {recipe.utkast ? "✅" : "📝"}
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
        on:refresh={() => dispatch('refresh')}
    />
{/if}

<!-- Add Ingredient Modal -->
{#if showAddModal}
    <AddIngredientModal
        name={addName}
        ean=""
        error={addError}
        open={showAddModal}
        on:close={closeAddModal}
        on:save={(e) => handleAddIngredient(e)}
        on:markBulkItem={(e) => handleCoverageAddBulk(e)}
    />
{/if}
