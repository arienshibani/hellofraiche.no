<script lang="ts">
    import { Table, TableBody, TableBodyRow, TableBodyCell, TableHead, TableHeadCell } from "flowbite-svelte";
    import { formatAmount } from "$lib/util/formatAmount.js";
    import { calculateIngredientPrice, getPackageSize, getIngredientDensity } from "$lib/util/conversions";
    import type { IngredientWithPrice, RecipeIngredient } from "$lib/types";
    import { HelpCircle } from "lucide-svelte";


    // Props
    export let ingredients: IngredientWithPrice[] = []; // Database ingredients with price data
    export let recipeIngredients: RecipeIngredient[] = []; // Recipe ingredients (name, amount, measurement)
    export let count = 1;
    export let totalRecipePrice = 0;

    // Shopping list state
    let checkedIngredients: Set<string> = new Set();
    
    // Tooltip state for mobile/desktop
    let showTooltip = false;

    // Reactive ingredient prices
    $: ingredientPrices = recipeIngredients.map(ingredient => {
        const price = calculateIngredientPriceAccurate(ingredient);
        console.log(`DEBUG: ${ingredient.name} - count: ${count}, amount: ${ingredient.amount}, price: ${price}`);
        return {
            ingredient,
            price,
            menyProduct: findMenyProduct(ingredient.name),
            isChecked: checkedIngredients.has(`${ingredient.name}-${ingredient.amount}-${ingredient.measurement}`)
        };
    });

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

    // Calculate ingredient price based on amount and Meny product using accurate conversions
    function calculateIngredientPriceAccurate(recipeIngredient: RecipeIngredient) {
        const menyProduct = findMenyProduct(recipeIngredient.name);
        if (!menyProduct || !menyProduct.current_price || !menyProduct.current_price.price) {
            return null;
        }

        const productPrice = menyProduct.current_price.price;
        const productWeight = menyProduct.weight || 100; // Default to 100g if no weight data

        console.log(`DEBUG CALC: ${recipeIngredient.name} - amount: ${recipeIngredient.amount}, count: ${count}, total: ${recipeIngredient.amount * count}`);

        // Use the conversion function for accurate pricing
        return calculateIngredientPrice(
            recipeIngredient.amount * count,
            recipeIngredient.measurement,
            recipeIngredient.name,
            productPrice,
            productWeight
        );
    }

    // Get user-friendly unit price display
    function getUnitPrice(productPrice: number, productWeight: number, measurement: string, ingredientName: string): string {
        const unit = measurement.toLowerCase();

        // For count-based units, show price per item
        if (unit === 'stk' || unit === 'boks' || unit === 'pakke') {
            const packageSize = getPackageSize(ingredientName);
            const itemsInPackage = productWeight / packageSize;
            const pricePerItem = productPrice / itemsInPackage;
            return `${pricePerItem.toFixed(2)} kr/stk`;
        }

        // For weight units, show price per kg
        if (unit === 'g' || unit === 'kg') {
            const pricePerKg = (productPrice / productWeight) * 1000;
            return `${pricePerKg.toFixed(2)} kr/kg`;
        }

        // For volume units, show price per liter
        if (unit === 'dl' || unit === 'ss' || unit === 'ts') {
            const density = getIngredientDensity(ingredientName);
            const productVolume = productWeight / density; // ml
            const pricePerLiter = (productPrice / productVolume) * 1000;
            return `${pricePerLiter.toFixed(2)} kr/l`;
        }
        
        // Fallback to per 100g
        const pricePer100g = (productPrice / productWeight) * 100;
        return `${pricePer100g.toFixed(2)} kr/100g`;
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
            <!-- Total Price Row at Top -->
            {#if totalRecipePrice > 0}
                <TableBodyRow class="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <TableBodyCell class="font-bold dark:text-white border-0 text-sm">
                        <div class="flex items-center gap-2">
                            <span>Estimert total pris</span>
                            <div class="relative">
                                <button
                                    class="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    on:click={() => showTooltip = !showTooltip}
                                    on:mouseenter={() => showTooltip = true}
                                    on:mouseleave={() => showTooltip = false}
                                    title="Hvorfor er prisen estimert?"
                                >
                                    <HelpCircle class="h-4 w-4" />
                                </button>
                                
                                {#if showTooltip}
                                    <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl w-56 z-[9999] whitespace-normal">
                                        <p class="leading-relaxed text-center">
                                            Faktisk pris kan variere og estimeres utifra at hver ingrediens er kjøpt i den mengden som er oppgitt i oppskriften.
                                        </p>
                                        <button 
                                            class="absolute top-2 right-2 text-gray-400 hover:text-white text-lg"
                                            on:click={() => showTooltip = false}
                                        >
                                            ×
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </TableBodyCell>
                    <TableBodyCell class="text-right border-0">
                                           <span class="text-lg font-bold text-gray-900 dark:text-white">
                       {totalRecipePrice.toFixed(2)} kr
                   </span>
                    </TableBodyCell>
                </TableBodyRow>
            {/if}
            
            {#each ingredientPrices as { ingredient, price: ingredientPrice, menyProduct, isChecked }}
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
                        <div class="flex flex-col items-end gap-1">
                            {#if ingredientPrice !== null && ingredientPrice !== undefined}
                                <div class="flex items-center gap-1">
                                    <span class="font-semibold text-md {isChecked ? 'line-through' : ''}">
                                        {ingredientPrice.toFixed(2)} kr
                                    </span>
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
                                <!-- Price explanation -->
                                {@const productWeight = menyProduct?.weight || 100}
                                {@const productPrice = menyProduct?.current_price?.price}
                                {#if productPrice && productWeight}
                                    {@const unitPrice = getUnitPrice(productPrice, productWeight, ingredient.measurement, ingredient.name)}
                                    {#if unitPrice}
                                        <span class="text-xs text-gray-500 dark:text-gray-400 {isChecked ? 'line-through' : ''} w-20 text-center">
                                            {unitPrice}
                                        </span>
                                    {/if}
                                {/if}
                            {:else}
                                <span class="text-gray-400 dark:text-gray-500 text-xs {isChecked ? 'line-through' : ''}">
                                    🤷
                                </span>
                            {/if}
                        </div>
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>