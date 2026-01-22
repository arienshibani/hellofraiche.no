<script lang="ts">
  import { goto } from "$app/navigation";
  import emblaCarouselSvelte from "embla-carousel-svelte";
  import type { Recipe } from "$lib/types";
  import RecipeCard from "$lib/components/ui/card/RecipeCard.svelte";

  export let id: string = "";
  export let title: string = "";
  export let subtitle: string = "";
  export let ariaLabel: string = "";
  export let Icon: any = null;
  export let iconClass: string = "";
  export let recipes: Array<Recipe & { estimatedPrice?: number }> = [];

  let isDragging = false;
  let dragResetTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let isPointerDown = false;
  const DRAG_THRESHOLD = 5; // pixels of movement before considering it a drag

  const emblaOptions = {
    align: "start" as const,
    containScroll: "trimSnaps" as const,
    dragFree: false,
    duration: 15
  };

  const handlePointerDown = (e: PointerEvent) => {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    isPointerDown = true;
    isDragging = false; // Start as false, only set to true if movement detected
    if (dragResetTimer) clearTimeout(dragResetTimer);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isPointerDown && !isDragging) {
      const deltaX = Math.abs(e.clientX - pointerStartX);
      const deltaY = Math.abs(e.clientY - pointerStartY);
      // Only set dragging if movement exceeds threshold
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        isDragging = true;
      }
    }
  };

  const handlePointerUp = () => {
    isPointerDown = false;
    dragResetTimer = setTimeout(() => {
      isDragging = false;
    }, 50); // Reduced delay for better responsiveness
  };

  const handleNavigate = (recipeTitle: string) => {
    goto(`/recipes/${recipeTitle}`);
  };
</script>

{#if recipes.length > 0}
  <div class="mb-12">
    <div class="mb-4 px-4 sm:px-6 lg:px-16">
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        {#if Icon}
          <Icon size={28} class={iconClass} />
        {/if}
        {title}
      </h2>
      {#if subtitle}
        <p class="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      {/if}
    </div>
    <div
      id={id}
      role="region"
      aria-label={ariaLabel}
      class="embla px-4 sm:px-6 lg:px-8 pb-4"
      use:emblaCarouselSvelte={{ options: emblaOptions, plugins: [] }}
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointercancel={handlePointerUp}
    >
      <div class="embla__container px-4 sm:px-6 lg:px-16">
        {#each recipes as recipe}
          <RecipeCard
            {recipe}
            className="embla__slide"
            {isDragging}
            onNavigate={handleNavigate}
          />
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .embla {
    overflow: hidden;
  }

  .embla__container {
    display: flex;
    gap: 48px;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }

  :global(.embla__slide) {
    flex: 0 0 60%;
  }

  @media (min-width: 640px) {
    /** for tablet */
    :global(.embla__slide) {
      flex-basis: 40%;
    }
  }

  @media (min-width: 1024px) {
    /** for laptop */
    :global(.embla__slide) {
      flex-basis: 33.333%;
    }
  }

  
  @media (min-width: 1280px) {
    /** for desktop */
    :global(.embla__slide) {
      flex-basis: 20%;
    }
  }

  .embla * {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -webkit-user-drag: none;
  }
</style>
