<script lang="ts">
    // Props
    export let ingredients: any[] = [];
    
    // Calculate ingredients needing attention
    $: ingredientsNeedingAttention = ingredients.filter(ingredient => {
        if (!ingredient.data || !ingredient.data.products || ingredient.data.products.length === 0) {
            return true; // No data at all
        }
        
        // Check if there's any product with valid price data
        const hasPriceData = ingredient.data.products.some((product: any) => {
            if (!product.current_price || !product.current_price.price) {
                return false;
            }
            
            const price = product.current_price.price;
            // Check if price is a valid number greater than 0
            return typeof price === 'number' && price > 0;
        });
        
        return !hasPriceData;
    });
    
    $: attentionCount = ingredientsNeedingAttention.length;
    $: hasIssues = attentionCount > 0;
</script>

{#if hasIssues}
    <div class="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Krever oppmerksomhet: {attentionCount} ingrediens{attentionCount === 1 ? '' : 'er'} mangler prisdata
                </h3>
                <div class="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    <p>
                        {attentionCount === 1 
                            ? 'Denne ingrediensen har ikke prisdata fra Kassal.app. ' 
                            : 'Disse ingrediensene har ikke prisdata fra Kassal.app. '
                        }
                        Dette kan skyldes:
                    </p>
                    <ul class="mt-1 ml-4 list-disc space-y-1">
                        <li>Feil EAN-nummer</li>
                        <li>Produktet er ikke tilgjengelig hos Kassal.app</li>
                        <li>Data har ikke blitt hentet ennå</li>
                    </ul>
                    <p class="mt-2 font-medium">
                        💡 <strong>Løsning:</strong> Sjekk EAN-nummeret og oppdater hvis nødvendig. 
                        Data oppdateres automatisk hver natt.
                    </p>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
        <div class="flex items-start">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
                    Alle ingredienser har prisdata! 🎉
                </h3>
                <div class="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                        Alle {ingredients.length} ingredienser har oppdatert prisdata fra Kassal.app. 
                        Alt ser bra ut!
                    </p>
                </div>
            </div>
        </div>
    </div>
{/if} 