<script>
    // @ts-nocheck
    import {
        PlusCircle,
        MinusCircle,
    } from "svelte-heros-v2";
    import { goto } from "$app/navigation";
    import { formatAmount } from "$lib/util/formatAmount.js";

    import { Card, Listgroup, Checkbox } from "flowbite-svelte";

    // Retrieve the recipes from the data.
    $: ({ mealPlan, nextMealPlanId, previousMealPlanId } = data);
    export let data;


    let count = 2;
    let price = 136.42; // Todo: store in DB lol

    function handlePlus() {
        count += 1;
        if (count >= 10) {
            // Do not allow the counter to go above 10
            count = 10;
        }
    }

    function handleMinus() {
        count -= 1;
        // Do not allow the counter to go below 1
        if (count <= 1) {
            count = 1;
        }
    }

    const handleNextMealPlan = () => {
        goto(`/plans/${data.nextMealPlanId}`);
    };

    const handlePreviousMealPlan = () => {
        goto(`/plans/${data.previousMealPlanId}`);
    };

    const ukedager = [
        "Mandag",
        "Tirsdag",
        "Onsdag",
        "Torsdag",
        "Fredag",
        "Lørdag",
        "Søndag",
    ];
</script>


<div class="dark:text-gray-200 dark:bg-gray-900">

<div class="grid mainContent gap-x-40 p-10">
    <Card class="h-max justify-self-end border-none shadow-none dark:bg-gray-800">
        <h1 class="text-slate-900 text-4xl text-center pt-24 pb-5 dark:text-white">
            {mealPlan.name}
        </h1>
        
        {#if mealPlan.estimatedPrice && mealPlan.estimatedPrice > 0}
          <div class="text-center mb-6">
            <span class="text-sm text-gray-600 dark:text-gray-400">Estimert total pris for ukemenyen:</span>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {mealPlan.estimatedPrice.toFixed(2)} kr
            </div>
          </div>
        {/if}

        <Listgroup
            items={mealPlan.recipes}
            let:item
            let:index
            class="border-0 dark:!bg-transparent pt-5"
        >
            <a href="/recipes/{item.title}">
                <div class="flex items-center space-x-4 mt-2.5 hover:scale-110 transition-transform duration-100">
                    <div class="flex-1 min-w-0">
                        <b>{ukedager[index]}</b>
                        <p
                            class="text-sm font-medium text-gray-900 truncate dark:text-white"
                        >
                            {item.title}
                        </p>

                        <p
                            class="text-sm text-gray-500 truncate dark:text-gray-400"
                        >
                            {item.subtitle}
                        </p>
                        {#if item.estimatedPrice && item.estimatedPrice > 0}
                          <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.estimatedPrice.toFixed(2)} kr
                          </p>
                        {:else}
                          <p class="text-xs text-gray-400 dark:text-gray-500">
                            Pris ikke tilgjengelig
                          </p>
                        {/if}
                    </div>
                </div>
            </a>
        </Listgroup>

        <p class="text-center text-gray-900 mt-8 mb-4 dark:text-white">Antall Personer</p>

        <div class="flex justify-evenly m-1">
            <button on:click={handleMinus}>
                <MinusCircle />
            </button>
            <span class="">
                {count}
                {count === 1 ? "Person" : "Personer"}
            </span>
            <button on:click={handlePlus}>
                <PlusCircle />
            </button>
        </div>

        <!-- #TODO: Enable this again when Meny... allows me to save more than 1 shopping list. 🫠

        <h1 class="text-xl text-center pt-16 text-gray-950">Bestill denne menyen</h1>
        
        <a class="items-center self-center" target="_blank" href="{mealPlan.menyUrl}">
            <button class="items-center self-center border border-black border-r-4 border-b-4  rounded-sm h-10 w-fit pr-4 pl-4 m-5" >
                {parseFloat((mealPlan.price * count).toFixed(2))} kr hos Meny
            </button>
        </a>

        <div class="flex justify-center">
            <h2 class="text-xs text-center pt-2 pb-5 max-w-content">  Handlelisten vil være forhånds utfylt for 2 personer. Prisen over er et estimat, og kan vike ifra faktis pris</h2>
        </div>
        -->
        
    </Card>

    <Card class="lastColumn h-max shadow-none rounded-sm mt-12 mb-14 dark:bg-gray-800">
        <h5
            class="text-md tracking-widest text-center leading-none text-gray-900 dark:text-white pb-5"
        >
            HANDLELISTE
        </h5>
        <Listgroup
            items={mealPlan.ingredients}
            let:item
            class="border-0 dark:!bg-transparent"
        >
            {item.name}
            <div class="">
                <Checkbox class="m-2 checked:bg-slate-900 outline-black" />
                {formatAmount(item.amount * count, item.measurement)}
            </div>
        </Listgroup>
        <br />
        <br />
        {#if mealPlan.bulkIngredients.length !== 0}
            <h5
                class="text-md tracking-widest text-center leading-none text-gray-900 dark:text-white pb-5"
            >
                FRA EGET KJØKKENSKAP
            </h5>
            <Listgroup
                items={mealPlan.bulkIngredients}
                let:item
                class="border-0 dark:!bg-transparent"
            >
                {item.name}
            </Listgroup>
        {/if}
    </Card>
</div>
</div>

<style>
    .mainContent {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 650px) {
        .mainContent {
            justify-content: center;
            grid-template-columns: none;
        }
    }

    button:hover {
        color: white;
        background-color: black;
        border-color: white;
    }
</style>
