<script lang="ts">
  export let features: string[] = [];
  export let title: string = "";
  export let className: string = "";
</script>

<div class="flex flex-col items-center justify-center w-full p-4 {className}">
  {#if title}
    <div class="text-center mb-12 max-w-3xl mx-auto">
      <h1 class="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
        <span class="">
          Lag din egen
        </span>
        <br />
        <span class="bg-gradient-to-r from-yellow-300 to-blue-600 dark:from-blue-600 dark:to-green-400 bg-clip-text text-transparent font-bold">
          Middagsplan
        </span>
      </h1>

    </div>
    <hr>
  {/if}

  <div class="dark:text-gray-200 w-full">
    <div class="flex items-center justify-center">
      <div class="max-w-3xl w-full flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <ul class="space-y-4 w-full">
          {#each features as feature}
            <li class="flex items-start space-x-3">
              <svg
                class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
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
              <span class="flex-1 text-gray-800 dark:text-gray-200 text-base sm:text-lg font-normal leading-7 break-words hyphens-auto">{feature}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</div>
