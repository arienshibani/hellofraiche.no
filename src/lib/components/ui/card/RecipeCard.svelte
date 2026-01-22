<script lang="ts">
  import { CookingPot, Clock, Users, PiggyBank } from "lucide-svelte";
  import { getLabelConfig, getLabelColorClasses, normalizeDietaryLabel } from "$lib/util/dietaryLabels";
  import type { Recipe } from "$lib/types";

  export let recipe: Recipe & { estimatedPrice?: number };
  export let className: string = "";
  export let isDragging: boolean = false;
  export let onNavigate: ((title: string) => void) | null = null;

  $: pricePerPortion = recipe.portions && recipe.portions > 0
    ? (recipe.estimatedPrice || 0) / recipe.portions
    : (recipe.estimatedPrice || 0);

  const handleClick = () => {
    if (!isDragging && onNavigate) {
      onNavigate(recipe.title);
    }
  };
</script>

<a
  href="/recipes/{encodeURIComponent(recipe.title)}"
  class="group overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col relative hover:shadow-lg transition-all duration-200 select-none {className}"
  style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
  on:click|preventDefault={handleClick}
>
  <!-- Recipe Image -->
  <div class="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
    {#if recipe.recipeImage}
      <img
        src={recipe.recipeImage}
        alt={recipe.title}
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        style="-webkit-user-drag: none; pointer-events: none;"
        draggable="false"
        loading="lazy"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
        <CookingPot size={32} class="text-gray-400 dark:text-gray-500" />
      </div>
    {/if}

    <!-- Dietary Labels Overlay -->
    {#if recipe.dietaryLabels && recipe.dietaryLabels.length > 0}
      <div class="absolute left-2 top-2 flex flex-wrap gap-1 max-w-[70%]">
        {#each recipe.dietaryLabels.slice(0, 2) as label}
          {@const config = getLabelConfig(label)}
          {@const Icon = config?.icon}
          <span
            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 {getLabelColorClasses(label, true)}"
          >
            {#if Icon}
              <Icon size={12} />
            {/if}
            <span>{normalizeDietaryLabel(label)}</span>
          </span>
        {/each}
        {#if recipe.dietaryLabels.length > 2}
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
            +{recipe.dietaryLabels.length - 2}
          </span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Recipe Content -->
  <div class="flex flex-col flex-grow p-3 sm:p-4">
    <div class="relative mb-1 sm:mb-2">
      <h3 class="font-semibold text-base sm:text-lg leading-tight text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors recipe-title-fade sm:line-clamp-2">
        {recipe.title}
      </h3>
    </div>

    {#if recipe.subtitle}
      <p class="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
        {recipe.subtitle}
      </p>
    {/if}

    <!-- Recipe Info -->
    <div class="mt-auto flex flex-col gap-1.5 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between text-xs sm:text-sm">


        <!-- Price per portion -->
        {#if recipe.estimatedPrice && recipe.estimatedPrice > 0}
        <div class="flex items-center gap-1 text-gray-900 dark:text-white text-sm sm:text-base">
 
          <span class="font-semibold">{pricePerPortion.toFixed(2)} kr</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">/ Porsjon</span>
        </div>
      {:else}
        <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
          <PiggyBank size={14} />
          <span>Pris ikke tilgjengelig</span>
        </div>
      {/if}

      <!-- Prep Time -->
      {#if recipe.prepTime && recipe.prepTime > 0}
      <div class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <Clock size={14} class="text-gray-500 dark:text-gray-400" />
        <span class="font-medium">{recipe.prepTime} min</span>
      </div>
    {:else}
      <div class="flex items-center gap-1 text-gray-400 dark:text-gray-500">
        <Clock size={14} />
        <span>-</span>
      </div>
    {/if}
      </div>
    </div>
  </div>
</a>

<style>
  :global(.recipe-title-fade) {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: clip;
    -webkit-mask-image: linear-gradient(to right, black 70%, transparent 100%);
    mask-image: linear-gradient(to right, black 70%, transparent 100%);
  }

  @media (min-width: 640px) {
    :global(.recipe-title-fade) {
      -webkit-mask-image: none;
      mask-image: none;
      white-space: normal;
      overflow: visible;
    }
  }
</style>