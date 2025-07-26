<script lang="ts">
    import { Table, TableBody, TableBodyRow, TableBodyCell, TableHead, TableHeadCell } from "flowbite-svelte";
    import { convertToGrams, calculateIngredientNutrition } from "$lib/util/conversions";
    import type { IngredientWithPrice, RecipeIngredient } from "$lib/types";

    // Props
    export let ingredients: IngredientWithPrice[] = [];
    export let recipeIngredients: RecipeIngredient[] = [];
    export let count = 1;

    // Function to find ingredient data
    function findIngredientData(ingredientName: string): IngredientWithPrice | null {
        return ingredients.find(ing => ing.name === ingredientName) || null;
    }

    // Calculate total weight and nutrition for the recipe
    $: recipeData = recipeIngredients.reduce((acc, recipeIngredient) => {
        const ingredientData = findIngredientData(recipeIngredient.name);
        if (!ingredientData || !ingredientData.data || !ingredientData.data.nutrition) return acc;

        // Use accurate conversion for weight calculation
        const recipeWeight = convertToGrams(recipeIngredient.amount * count, recipeIngredient.measurement, recipeIngredient.name);
        acc.totalWeight += recipeWeight;

        // Calculate nutrition based on weight ratio
        // For now, we'll use the base nutrition values scaled by amount
        // TODO: In the future, use calculateIngredientNutrition with product weight
        ingredientData.data.nutrition.forEach((nutritionItem: {
            code: string;
            display_name: string;
            amount: number;
            unit: string;
        }) => {
            const existing = acc.nutrition.find(item => item.code === nutritionItem.code);
            if (existing) {
                existing.amount += nutritionItem.amount * (recipeIngredient.amount * count);
            } else {
                acc.nutrition.push({
                    code: nutritionItem.code,
                    display_name: nutritionItem.display_name,
                    amount: nutritionItem.amount * (recipeIngredient.amount * count),
                    unit: nutritionItem.unit
                });
            }
        });

        return acc;
    }, {
        nutrition: [] as Array<{
            code: string;
            display_name: string;
            amount: number;
            unit: string;
        }>,
        totalWeight: 0
    });

    $: totalNutrition = recipeData.nutrition;
    $: totalWeight = recipeData.totalWeight;

    // Common nutrition codes to display in order
    const nutritionOrder = [
        'energi_kcal',
        'energi_kj', 
        'protein',
        'fett_totalt',
        'mettet_fett',
        'enumettet_fett',
        'flerumettet_fett',
        'karbohydrater',
        'sukkerarter',
        'salt'
    ];

    // Sort nutrition by predefined order
    $: sortedNutrition = totalNutrition.sort((a, b) => {
        const aIndex = nutritionOrder.indexOf(a.code);
        const bIndex = nutritionOrder.indexOf(b.code);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });
</script>

{#if sortedNutrition.length > 0}
    <div class="mt-8">
        <h2 class="text-2xl font-extrabold dark:text-white mb-6 text-center">Næringsverdier</h2>
        
        <div class="overflow-x-auto flex justify-center">
            <Table class="w-full max-w-lg border-0">
                <TableHead>
                    <TableHeadCell class="w-1/2 border-0">Næringsstoff</TableHeadCell>
                    <TableHeadCell class="w-1/2 text-right border-0">Per 100g</TableHeadCell>
                </TableHead>
                                       <TableBody>
                           {#each sortedNutrition as nutrition}
                               {@const per100g = totalWeight > 0 ? (nutrition.amount / totalWeight) * 100 : 0}
                               <TableBodyRow class="hover:bg-gray-50 dark:hover:bg-gray-700 border-0">
                                   <TableBodyCell class="font-medium dark:text-white border-0 text-sm">
                                       {nutrition.display_name}
                                   </TableBodyCell>
                                   <TableBodyCell class="text-right border-0">
                                       <span class="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                                           {per100g.toFixed(1)} {nutrition.unit}
                                       </span>
                                   </TableBodyCell>
                               </TableBodyRow>
                           {/each}
                       </TableBody>
            </Table>
        </div>
        
                       {#if totalWeight > 0}
                   <div class="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                       Estimert total vekt: {totalWeight.toFixed(0)}g ({#if count > 1}({(totalWeight / count).toFixed(0)}g per porsjon){/if})
                   </div>
               {/if}
    </div>
{/if} 