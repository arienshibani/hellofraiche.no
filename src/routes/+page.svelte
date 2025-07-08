<script>
    import { ArrowRight } from "svelte-heros-v2";
    import { Card } from "flowbite-svelte";
    import InfiniteScroll from "$lib/components/ui/infinite-scroll/InfiniteScroll.svelte";
    import { goto } from "$app/navigation";

    // Retreived from +server.js load function
    export let data;
    $: ({ recipes } = data);

    let onPhone;
    let mediaQ = "xl";
    if (typeof window !== "undefined") {
        onPhone = window.matchMedia("(min-width: 600px)");
        mediaQ = onPhone.matches ? "xl" : "xs";
    }

    const message = "%c https://github.com/arienshibani %c";
    const style1 = "background: linear-gradient(to right, red, orange);";
    const style2 = "color: white; font-weight: bold;";

    const recipeCount = data.recipes.length;
    const mealPlanCount = data.mealplans.length;

</script>

<section class="dark:bg-gray-900">


    <div class="flex flex-col items-center justify-center w-full p-4 fixed mt-20">
        <div class="text-4xl md:text-6xl font-bold text-black text-center">
            Ka <span class="text-orange-400">faaaen</span> skal du
        </div>

        <div class="text-4xl md:text-6xl font-bold relative text-center">
            <span
                class="bg-orange-300 absolute -bottom-1 h-[35%] w-[101%] mr-[1px]"
            ></span>
            <span class="text-black relative"> ha til middag idag?</span>
        </div>

        <div class="pt-111 pb-6 pt-12">
            <div class="flex items-start justify-center">
                <div
                    class="h-[200px] w-[400px] bg-white rounded-l-xl flex flex-col items-start p-5"
                >
                    <div class="space-y-4">
                        <div class="flex items-start space-x-3">
                            <svg
                                class="w-5 h-5 text-black mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                ></path></svg
                            >
                            <span class="text-black">
                                {mealPlanCount} Ukemenyer og {recipeCount} oppskrifter</span
                            >
                        </div>
                        <div class="flex items-start space-x-3">
                            <svg
                                class="w-5 h-5 text-black mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                ></path></svg
                            >
                            <span class="text-black"
                                >Velg selv hvor og når du handler inn</span
                            >
                        </div>
                        <div class="flex items-start space-x-3">
                            <svg
                                class="w-5 h-5 text-black mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 13l4 4L19 7"
                                ></path></svg
                            >
                            <span class="text-black"
                                >Spar penger, ingen måndlige avgifter
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>

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
                                <Card class="w-full max-w-[380px] h-[160px] mb-8 cursor-pointer hover:shadow-lg transition-shadow duration-100" on:click={() => goto(`/recipes/${item.title}`)}>
                <div class="p-4 h-full flex flex-col justify-between">
                    <div class="flex-1 flex items-center justify-center">
                        <h5 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white truncate-title text-center">
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