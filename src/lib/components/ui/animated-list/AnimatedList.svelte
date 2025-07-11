<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  export let items = [
    'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5',
    'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10',
    'Item 11', 'Item 12', 'Item 13', 'Item 14', 'Item 15'
  ];
  export let showGradients = true;
  export let enableArrowNavigation = true;
  export let className = '';
  export let itemClassName = '';
  export let displayScrollbar = true;
  export let initialSelectedIndex = -1;

  let listRef;
  let selectedIndex = initialSelectedIndex;
  let keyboardNav = false;
  let topGradientOpacity = 0;
  let bottomGradientOpacity = 1;
  const dispatch = createEventDispatcher();

  function handleScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    topGradientOpacity = Math.min(scrollTop / 50, 1);
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    bottomGradientOpacity = scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1);
  }

  function handleKeyDown(e) {
    if (!enableArrowNavigation) return;
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      keyboardNav = true;
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
      e.preventDefault();
      keyboardNav = true;
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        e.preventDefault();
        dispatch('itemSelect', { item: items[selectedIndex], index: selectedIndex });
      }
    }
  }

  onMount(() => {
    if (enableArrowNavigation) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (enableArrowNavigation) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  });

  $: if (keyboardNav && selectedIndex >= 0 && listRef) {
    const container = listRef;
    const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
      } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: 'smooth',
        });
      }
    }
    keyboardNav = false;
  }
</script>

<div class={`scroll-list-container ${className}`}>
  <div
    bind:this={listRef}
    class={`scroll-list ${!displayScrollbar ? 'no-scrollbar' : ''}`}
    on:scroll={handleScroll}
  >
    {#each items as item, index (index)}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        data-index={index}
        on:mouseenter={() => selectedIndex = index}
        on:click={() => {
          selectedIndex = index;
          dispatch('itemSelect', { item, index });
        }}
        on:keydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            selectedIndex = index;
            dispatch('itemSelect', { item, index });
          }
        }}
        tabindex="0"
        role="button"
        class={`item ${selectedIndex === index ? 'selected' : ''} ${itemClassName}`}
        transition:scale={{ duration: 200, start: 0.7, opacity: 0 }}
        style="margin-bottom: 1rem; cursor: pointer;"
      >
        <p class="item-text">{item}</p>
      </div>
    {/each}
  </div>
  {#if showGradients}
    <div class="top-gradient" style="opacity: {topGradientOpacity}"></div>
    <div class="bottom-gradient" style="opacity: {bottomGradientOpacity}"></div>
  {/if}
</div>

<style>
.scroll-list-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.scroll-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  background: white;
  border-radius: 1rem;
}
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.item {
  background: #f9f9f9;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.item.selected {
  background: #e0e7ff;
  box-shadow: 0 2px 8px rgba(99,102,241,0.15);
}
.item-text {
  margin: 0;
  font-size: 1.1rem;
}
.top-gradient, .bottom-gradient {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2.5rem;
  pointer-events: none;
  z-index: 2;
  transition: opacity 0.2s;
}
.top-gradient {
  top: 0;
  background: linear-gradient(to bottom, #fff 80%, transparent);
}
.bottom-gradient {
  bottom: 0;
  background: linear-gradient(to top, #fff 80%, transparent);
}
</style>