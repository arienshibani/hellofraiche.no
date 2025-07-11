<script lang="ts">
  export let features: string[] = [];
  export let title: string = "";
  export let className: string = "";
</script>

<div class="flex flex-col items-center justify-center w-full p-4 fixed mt-20 {className}">
  {#if title}
    <div class="text-4xl md:text-6xl font-bold text-center mb-8">

    </div>
  {/if}

  <div class="dark:text-gray-200 ">
    <div class="flex items-start justify-center">
      <div class=" w-[400px]rounded-xl flex flex-col items-start p-5 m-10">
        <div class="space-y-4">
          {#each features as feature}
            <div class="flex items-start space-x-3">
              <svg
                class="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <span class="">{feature}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
