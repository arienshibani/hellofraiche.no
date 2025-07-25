<script lang="ts">
    import { Table, TableBody, TableBodyRow, TableBodyCell, TableHead, TableHeadCell } from "flowbite-svelte";
    import { formatAmount } from "$lib/util/formatAmount.js";
    import type { IngredientWithPrice, RecipeIngredient } from "$lib/types";


    // Props
    export let ingredients: IngredientWithPrice[] = []; // Database ingredients with price data
    export let recipeIngredients: RecipeIngredient[] = []; // Recipe ingredients (name, amount, measurement)
    export let count = 1;
    export let totalRecipePrice = 0;

    // Shopping list state
    let checkedIngredients: Set<string> = new Set();

    // Handle ingredient click
    function toggleIngredient(ingredient: RecipeIngredient) {
        const key = `${ingredient.name}-${ingredient.amount}-${ingredient.measurement}`;

        if (checkedIngredients.has(key)) {
            checkedIngredients.delete(key);
        } else {
            checkedIngredients.add(key);
        }

        // Force reactivity by reassigning the Set
        checkedIngredients = new Set(checkedIngredients);
    }

    // Function to find Meny product for an ingredient
    function findMenyProduct(ingredientName: string) {
        const ingredient = ingredients.find(ing => ing.name === ingredientName);
        if (!ingredient || !ingredient.data || !ingredient.data.products) return null;
        // Find Meny product
        return ingredient.data.products.find(product =>
            product.store && product.store.name === 'Meny'
        ) || null;
    }

    // Calculate ingredient price based on amount and Meny product
    function calculateIngredientPrice(recipeIngredient: RecipeIngredient) {
        const menyProduct = findMenyProduct(recipeIngredient.name);
        if (!menyProduct || !menyProduct.current_price || !menyProduct.current_price.price) {
            return null;
        }

        const basePrice = menyProduct.current_price.price;
        const baseAmount = recipeIngredient.amount;

        // For now, we'll use the base price as-is
        // #TODO: In the future, we could implement more sophisticated price calculations
        // based on weight/volume units
        return basePrice;
    }
</script>

<!-- Ingredients Table -->
<div class="overflow-x-auto flex justify-center">
    <Table class="w-full max-w-sm border-0">
        <TableHead>
            <TableHeadCell class="w-2/3 border-0">Ingrediens</TableHeadCell>
            <TableHeadCell class="w-1/3 text-right border-0">Pris</TableHeadCell>
        </TableHead>
                <TableBody>
            {#each recipeIngredients as ingredient}
                {@const ingredientPrice = calculateIngredientPrice(ingredient)}
                {@const menyProduct = findMenyProduct(ingredient.name)}
                {@const isChecked = checkedIngredients.has(`${ingredient.name}-${ingredient.amount}-${ingredient.measurement}`)}
                <TableBodyRow
                    class="hover:bg-gray-50 dark:hover:bg-gray-700 border-0 cursor-pointer"
                    on:click={() => toggleIngredient(ingredient)}
                >
                    <TableBodyCell class="font-medium dark:text-white border-0 text-sm">
                        <div class="flex items-center">
                            <span class="text-gray-500 dark:text-gray-400 font-normal min-w-[3rem] text-right">
                                {formatAmount(ingredient.amount * count, ingredient.measurement)}
                            </span>
                            <span class="ml-3 flex-1 {isChecked ? 'line-through text-gray-500 dark:text-gray-400' : ''}">
                                {ingredient.name}
                            </span>
                        </div>
                    </TableBodyCell>
                    <TableBodyCell class="text-right border-0">
                        <div class="flex items-center justify-end gap-1">
                            {#if ingredientPrice !== null && ingredientPrice !== undefined}
                                <span class="font-semibold  text-md {isChecked ? 'line-through' : ''}">
                                    {ingredientPrice.toFixed(2)} kr
                                </span>
                            {:else}
                                <span class="text-gray-400 dark:text-gray-500 text-xs {isChecked ? 'line-through' : ''}">
                                    🤷
                                </span>
                            {/if}
                            {#if menyProduct && menyProduct.url}
                                <a
                                    href={menyProduct.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                    title="Kjøp hos Meny"
                                    on:click|stopPropagation
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            {:else}
                                <span class="text-gray-400 dark:text-gray-500 text-xs">-</span>
                            {/if}
                        </div>
                    </TableBodyCell>
                </TableBodyRow>
            {/each}

            <!-- Total Price Row -->
            {#if totalRecipePrice > 0}
                <TableBodyRow class="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <TableBodyCell class="font-bold dark:text-white border-0 text-sm">
                        Sum
                    </TableBodyCell>
                    <TableBodyCell class="text-right border-0">
                        <span class="text-lg font-bold text-green-600 dark:text-green-400">
                            {totalRecipePrice.toFixed(2)} kr
                        </span>
                    </TableBodyCell>
                </TableBodyRow>
            {/if}
        </TableBody>
    </Table>
</div>