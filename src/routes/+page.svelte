<script>
    import { ArrowRight } from "svelte-heros-v2";
    import { Card } from "flowbite-svelte";
    import InfiniteScroll from "$lib/components/ui/infinite-scroll/InfiniteScroll.svelte";
    import { goto } from "$app/navigation";
    import FeatureList from "$lib/components/ui/feature-list/FeatureList.svelte";
    import { onMount } from "svelte";
    import { Utensils } from "lucide-svelte";
    import { getLabelConfig, getLabelColorClasses } from '$lib/util/dietaryLabels';

    // Retreived from +server.js load function
    export let data;
    $: ({ recipes } = data);

    let onPhone;
    let mediaQ = "xl";
    let isLoaded = false;

    if (typeof window !== "undefined") {
        onPhone = window.matchMedia("(min-width: 600px)");
        mediaQ = onPhone.matches ? "xl" : "xs";
    }

    onMount(() => {
        // Small delay to ensure layout calculations are complete
        setTimeout(() => {
            isLoaded = true;
        }, 500);
    });

    const recipeCount = data?.recipes?.length || 0;
    const mealPlanCount = data?.mealplans?.length || 0;

</script>

    <svelte:head>
        <title>God Middag! 🍽️</title>
      </svelte:head>

<!-- Loading overlay -->
{#if !isLoaded}
   <FeatureList className="pointer-events-none"
title="Go middag! 👋"
features={[
    `${mealPlanCount} Ukemenyer og ${recipeCount} oppskrifter! Flere kommer`,
    "Live prisoversikt på alle ukemenyer / oppskrifter",
    "Søk etter oppskrifter, ingredienser eller ukemenyer",
]}
/>
    <div class="fixed inset-0 z-50 flex items-center justify-center loading-overlay">
        <div class="text-2xl font-bold text-gray-600 dark:text-gray-300"><Utensils size="50px"/></div>
    </div>
{/if}


{#if isLoaded}
<section class="dark:bg-gray-900 bg-white relative z-10">

    <InfiniteScroll
    width="100%"
    maxHeight=""
    negativeMargin="-0.9em"
    items={data.recipes}
    isTilted={true}
    tiltDirection="right"
    autoplay={true}
    autoplaySpeed={1.5}
    autoplayDirection="up"
    pauseOnHover={false}
>
    <svelte:fragment slot="default" let:item>
                                <Card class="w-full max-w-[280px] h-auto min-h-[160px] bg-sky-100 dark:bg-gray-800 mb-8 cursor-pointer hover:shadow-lg transition-shadow duration-100" on:click={() => goto(`/recipes/${item.title}`)}>
                <div class="p-4 h-full flex flex-col justify-between">
                    <div class="flex-1 flex flex-col items-center justify-center">
                        <h5 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
                            {item.title}
                        </h5>
                        <div class="mt-2">
                            <p class="text-sm text-gray-600 dark:text-gray-400 truncate-subtitle">
                                {item.subtitle}
                            </p>
                        </div>
                        <!-- Dietary Labels -->
                        {#if item.dietaryLabels && item.dietaryLabels.length > 0}
                          <div class="flex flex-wrap justify-center gap-1.5 mt-2">
                            {#each item.dietaryLabels as label}
                              {@const config = getLabelConfig(label)}
                              {@const Icon = config?.icon}
                              <span
                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {getLabelColorClasses(label, true)}"
                              >
                                {#if Icon}
                                  <Icon size={12} />
                                {/if}
                                <span>{label}</span>
                              </span>
                            {/each}
                          </div>
                        {/if}
                    </div>
                </div>
            </Card>
    </svelte:fragment>
  </InfiniteScroll>

  <FeatureList className="pointer-events-none"
  title="Go middag! 👋"
  features={[
      `${mealPlanCount} Ukemenyer og ${recipeCount} oppskrifter! Flere kommer`,
      "Live prisoversikt på alle ukemenyer / oppskrifter",
      "Søk etter oppskrifter, ingredienser eller ukemenyer",
  ]}
/>

</section>
{/if}

<style>
    .truncate-subtitle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    section {
        position: relative;
        z-index: 10;
        min-height: 100vh;
        background: transparent;
    }

</style>

