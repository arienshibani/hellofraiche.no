<script lang="ts">
  import { BottleWine, ExternalLink } from "lucide-svelte";
  import type { WinePairing } from "$lib/types";
  import { buildVinmonopoletSearchUrl } from "$lib/util/vinmonopolet";

  export let winePairing: WinePairing | undefined;

  $: vinmonopoletUrl = buildVinmonopoletSearchUrl(winePairing);

  const getWinePairingConfig = (winePairing: WinePairing | undefined) => {
    const category = winePairing?.category === "red" ? "red" : "white";

    if (category === "red") {
      return {
        label: "Rødvin",
        badgeClass:
          "border border-red-200 bg-red-50/90 text-red-900 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200",
        iconClass: "text-red-600 dark:text-red-400",
      };
    }

    return {
      label: "Hvitvin",
      badgeClass:
        "border border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100",
      iconClass: "text-amber-500 dark:text-amber-300",
    };
  };
</script>

{#if winePairing}
  {@const config = getWinePairingConfig(winePairing)}
  <section class="px-4 pb-16 sm:pb-24 flex justify-center">
    <div
      class="w-full max-w-2xl rounded-2xl bg-white/90 dark:bg-gray-900/90 shadow-sm ring-1 ring-gray-200/80 dark:ring-gray-700/80 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start"
    >
      <div
        class="flex items-center justify-center shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800"
      >
        <BottleWine class={`w-6 h-6 ${config.iconClass}`} />
      </div>
      <div class="flex-1 space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <span
          class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold"
        >
          Vintips til retten
        </span>
          
          <span
            class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.badgeClass}`}
          >
            <span>{config.label}</span>
            
            {#if winePairing.variety}
              <span class="text-xs text-gray-700 dark:text-gray-200">
                • {winePairing.variety}
              </span>
            {/if}
          </span>

        </div>
        {#if winePairing.description}
          <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-200 italic">
            "{winePairing.description}"
          </p>
        {/if}
        {#if vinmonopoletUrl}
          <a
            href={vinmonopoletUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-2"
          >
            <span>Se vin på Vinmonopolet</span>
            <ExternalLink size={14} class="shrink-0" />
          </a>
        {/if}
      </div>
    </div>
  </section>
{/if}

