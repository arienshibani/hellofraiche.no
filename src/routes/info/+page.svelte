<script>
  // @ts-nocheck

  import { ArrowRight } from "svelte-heros-v2";
  import { ImagePlaceholder } from "flowbite-svelte";
  import { Utensils, Edit, Package, ChefHat } from "lucide-svelte";
</script>


<svelte:head>
  <title>Hello Fraiche</title>
</svelte:head>

<div class="dark:text-gray-200 dark:bg-gray-900">


<h1 class="text-5xl text-center pt-24 font-bold dark:text-white flex items-center justify-center gap-3">
  <Utensils size={48} class="text-gray-700 dark:text-gray-300" />
  Billig Mat
</h1>

<h1 class="text-3xl text-center p-2 pt-20 dark:text-white flex items-center justify-center gap-2">
  <Edit size={32} class="text-gray-700 dark:text-gray-300" />
  1. Velg middagsplan
</h1>
<div
  class="gridsetup grid p-12 grid-cols-2 gap-4 items-center max-w-4xl mt-0 m-auto dark:bg-gray-900 dark:text-white"
>
  <img
    class="max-h-[300px] rounded-sm"
    src="https://images.squarespace-cdn.com/content/53b839afe4b07ea978436183/1608506201082-GU22QYZJC5TWXRSY24RX/traditional-food-around-the-world-Travlinmad.jpg?content-type=image%2Fjpeg"
    alt="food that contains creme fraiche"
  />
  <p class="pl-8 relative text-xl dark:text-gray-200">
    Velg en ukemeny som passer deg og antallet personer du vil lage mat til, og
    Hallo Fraiche genererer handlelisten for deg automatisk.
  </p>
</div>

<h1 class="text-3xl text-center p-2 pt-10 dark:text-white flex items-center justify-center gap-2">
  <Package size={32} class="text-gray-700 dark:text-gray-300" />
  2. Kjøp råvarene
</h1>

<div
  class="gridsetup grid p-12 grid-cols-2 gap-4 items-center max-w-4xl mt-0 m-auto dark:bg-gray-900 dark:text-white"
>
  <!-- This tag gets hidden on mobile phones in order to not mess up the grid layout -->
  <p class="pr-8 relative text-xl hideOnSmallScreens dark:text-gray-200">
    Enten du foretrekker å handle selv, eller bestiller råvarene via levering
    rett på døren, spiller det ingen rolle. Uansett hva du velger, er det mer
    kostnadseffektivt enn noen annen matkasse!
  </p>

  <template>
    <ImagePlaceholder imgHeight={60} class="mt-8" />
  </template>
  <img
    class="max-h-[300px] rounded-sm"
    src="https://thehappyfoodie.co.uk/wp-content/uploads/2021/08/pasta_8_215_img_s900x0_c1931x1128_l0x643.jpg"
    alt="food that inneholder creme fraiche"
  />

  <!-- This tag gets displayed on mobile phones in order to not mess up the grid layout -->
  <p class="relative text-xl hideOnLargeScreens dark:text-gray-200">
    Bestill alt du trenger direkte fra dagligvare butikken din på 1-2-3! Eller
    kjøp alt selv, så sparer du enda mer.
  </p>
</div>

<!-- Button: Links to /plans -->
<a href="/plans">
  <div class="flex">
    <button
      class="m-auto border border-black border-r-4 border-b-4 rounded-sm h-10 w-fit pr-4 pl-4 mt-20 mb-40 hover:scale-110 transition-transform duration-300 dark:bg-gray-800 dark:text-white dark:border-white"
    >
      <div class="flex items-center gap-2">
        <ChefHat size={18} />
        Finn din plan!
        <ArrowRight class="inline" />
      </div>
    </button>
  </div>
</a>
</div>

<style>
  button:hover {
    color: white;
    background-color: black;
    border-color: white;
  }

  .hideOnLargeScreens {
    display: none;
  }

  @media (max-width: 650px) {
    .hideOnLargeScreens {
      display: inherit;
    }

    .hideOnSmallScreens {
      display: none;
    }

    .gridsetup {
      display: block;
      font-size: 80%;
    }

    p {
      position: relative;
      margin: -3rem 0 2rem 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 255);
      opacity: 0.8;
    }
  }
</style>
