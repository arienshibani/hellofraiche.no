<script>
    import { ArrowRight } from "svelte-heros-v2";
    import { Card } from "flowbite-svelte";
    import InfiniteScroll from "$lib/components/ui/infinite-scroll/InfiniteScroll.svelte";
    import { goto } from "$app/navigation";
    import FeatureList from "$lib/components/ui/feature-list/FeatureList.svelte";

    // Retreived from +server.js load function
    export let data;
    $: ({ recipes } = data);

    let onPhone;
    let mediaQ = "xl";
    if (typeof window !== "undefined") {
        onPhone = window.matchMedia("(min-width: 600px)");
        mediaQ = onPhone.matches ? "xl" : "xs";
    }


    const recipeCount = data.recipes.length;
    const mealPlanCount = data.mealplans.length;

</script>

<section class="dark:bg-gray-900 relative z-10">





    <FeatureList
        title="Go middag! 👋"
        features={[
            `${mealPlanCount} Ukemenyer og ${recipeCount} oppskrifter`,
            "Prisoversikt på alle ukemenyer / oppskrifter",
            "Velg selv når du handler inn og hvordan",
            "Spar penger, ingen måndlige avgifter",
            "100% gratis og åpen kildekode",

        ]}
    />

    <InfiniteScroll
    width="100%"
    maxHeight="100%"
    negativeMargin="-2.5em"
    items={data.recipes}
    isTilted={true}
    tiltDirection="right"
    autoplay={true}
    autoplaySpeed={0.9}
    autoplayDirection="down"
    pauseOnHover={false}
>
    <svelte:fragment slot="default" let:item>
                                <Card class="w-full max-w-[280px] h-[160px] mb-8 cursor-pointer hover:shadow-lg transition-shadow duration-100" on:click={() => goto(`/recipes/${item.title}`)}>
                <div class="p-4 h-full flex flex-col justify-between">
                    <div class="flex-1 flex items-center justify-center">
                        <h5 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
                            {item.title}
                        </h5>
                    </div>
                    <div class="mt-2">
                        <p class="text-sm text-gray-600 dark:text-gray-400 truncate-subtitle">
                            {item.subtitle}
                        </p>
                    </div>
                </div>
            </Card>
    </svelte:fragment>
  </InfiniteScroll>
  </section>

<style>
    .truncate-title {
        white-space: nowrap;
        font-size: clamp(0.4rem, 1.5vw, 1.25rem);
        line-height: 1.2;
        max-width: 100%;
        height: 1.2em; /* Fixed height for 1 line */
        word-wrap: break-word;
    }

    .truncate-subtitle {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
    }

    /* Aurora background styling */
    :global(.aurora-container) {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1;
        background: transparent;
    }

    section {
        position: relative;
        z-index: 10;
        min-height: 100vh;
        background: transparent;
    }

    /* Make sure content is visible over aurora */
    .text-black {
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    }
</style>