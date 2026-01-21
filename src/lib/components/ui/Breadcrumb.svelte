<script lang="ts">
  import { goto } from '$app/navigation';

  export let items: Array<{ label: string; href?: string }> = [];

  function handleClick(item: { label: string; href?: string }, event: MouseEvent) {
    if (item.href) {
      event.preventDefault();
      goto(item.href);
    }
  }
</script>

<nav class="flex" aria-label="Breadcrumb">
  <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse text-sm">
    {#each items as item, index}
      {#if index === items.length - 1}
        <!-- Current page -->
        <li aria-current="page">
          <div class="flex items-center space-x-1.5">
            {#if index > 0}
              <svg class="w-3.5 h-3.5 rtl:rotate-180 text-gray-400 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
              </svg>
            {/if}
            <span class="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {item.label}
            </span>
          </div>
        </li>
      {:else if index === 0}
        <!-- Home icon -->
        <li class="inline-flex items-center">
          <a 
            href={item.href || '#'} 
            class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            on:click={(e) => handleClick(item, e)}
          >
            <svg class="w-4 h-4 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"/>
            </svg>
            {item.label}
          </a>
        </li>
      {:else}
        <!-- Middle items -->
        <li>
          <div class="flex items-center space-x-1.5">
            <svg class="w-3.5 h-3.5 rtl:rotate-180 text-gray-400 dark:text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
            </svg>
            <a 
              href={item.href || '#'} 
              class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              on:click={(e) => handleClick(item, e)}
            >
              {item.label}
            </a>
          </div>
        </li>
      {/if}
    {/each}
  </ol>
</nav>
