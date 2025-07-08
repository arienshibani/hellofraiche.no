<script lang="ts">
  export let features: string[] = [];
  export let title: string = "";
  export let className: string = "";
</script>

<div class="flex flex-col items-center justify-center w-full p-4 fixed mt-20 {className}">
  {#if title}
    <div class="text-4xl md:text-6xl font-bold text-black text-center mb-8">
      {title}
    </div>
  {/if}

  <div class="">
    <div class="flex items-start justify-center">
      <div class="w-[400px] bg-white rounded-xl flex flex-col items-start p-5 m-10">
        <div class="space-y-4">
          {#each features as feature}
            <div class="flex items-start space-x-3">
              <svg
                class="w-5 h-5 text-black mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span class="text-black">{feature}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
