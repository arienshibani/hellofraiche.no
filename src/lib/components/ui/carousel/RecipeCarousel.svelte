<script lang="ts">
  import { goto } from "$app/navigation";
  import emblaCarouselSvelte from "embla-carousel-svelte";
  import AutoScroll from "embla-carousel-auto-scroll";
  import type { Recipe } from "$lib/types";
  import RecipeCard from "$lib/components/ui/card/RecipeCard.svelte";
  import { onMount, onDestroy } from "svelte";

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
  let emblaApi: any = null;
  const DRAG_THRESHOLD = 5; // pixels of movement before considering it a drag

  // Initialize auto-scroll plugin for continuous smooth scrolling
  const autoScrollPlugin = AutoScroll({
    speed: 0.0, // Pixels per frame (lower = slower, smoother) - adjust for desired speed
    startDelay: 1000, // Small delay before starting
    stopOnInteraction: true, // Stop scrolling when user interacts
    stopOnFocusIn: true // Stop scrolling when carousel receives focus
  });

  const emblaOptions = {
    align: "start" as const,
    containScroll: "keepSnaps" as const,
    dragFree: true, // Enable free dragging for smoother feel
    duration: 25,
    loop: false // Enable looping for continuous scroll
  };

  // Clone recipes at both ends for seamless infinite loop
  // Structure: [end clones] + [original] + [beginning clones]
  $: clonedRecipes = recipes.length > 0 ? [...recipes, ...recipes, ...recipes] : [];
  
  // Calculate the starting index (middle section - the original recipes) with random offset
  // Generate a random offset once when recipes are available
  let randomOffset = 0;
  $: if (recipes.length > 0 && randomOffset === 0) {
    randomOffset = Math.floor(Math.random() * recipes.length);
  }
  $: startIndex = recipes.length + randomOffset;

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

  // Handle Embla initialization
  const handleEmblaInit = (event: CustomEvent) => {
    emblaApi = event.detail;
    // Start carousel in the middle section (original recipes)
    if (emblaApi && startIndex > 0) {
      setTimeout(() => {
        emblaApi.scrollTo(startIndex, false);
      }, 100);
    }
  };

  // Handle seamless loop transitions
  const handleSelect = () => {
    if (!emblaApi || recipes.length === 0) return;
    
    const selectedIndex = emblaApi.selectedScrollSnap();
    const originalCount = recipes.length;
    
    // If we're in the first clone section (end), jump to the corresponding slide in the original section
    if (selectedIndex < originalCount) {
      emblaApi.scrollTo(selectedIndex + originalCount, true); // true = instant jump
    }
    // If we're in the last clone section (beginning), jump to the corresponding slide in the original section
    else if (selectedIndex >= originalCount * 2) {
      emblaApi.scrollTo(selectedIndex - originalCount, true); // true = instant jump
    }
  };

  onMount(() => {
    // Start carousel in the middle section (original recipes)
    if (emblaApi && startIndex > 0) {
      emblaApi.scrollTo(startIndex, false);
    }
  });

  onDestroy(() => {
    // Cleanup auto-scroll on component destroy
    if (autoScrollPlugin && typeof autoScrollPlugin.stop === 'function') {
      autoScrollPlugin.stop();
    }
  });
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
      use:emblaCarouselSvelte={{ options: emblaOptions, plugins: [autoScrollPlugin] }}
      on:emblaInit={handleEmblaInit}
      on:select={handleSelect}
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointercancel={handlePointerUp}
    >
      <div class="embla__container px-4 sm:px-6 lg:px-16">
        {#each clonedRecipes as recipe, index}
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
