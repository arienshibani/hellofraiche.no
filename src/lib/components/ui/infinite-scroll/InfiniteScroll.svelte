<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import './InfiniteScroll.css';
  import { fade } from 'svelte/transition';

  export let width = "30rem";
  export let maxHeight = "100%";
  export let negativeMargin = "-0.5em";
  export let items: any[] = [];
  export let itemMinHeight = 150;
  export let isTilted = false;
  export let tiltDirection: "left" | "right" = "left";
  export let autoplay = false;
  export let autoplaySpeed = 0.5;
  export let autoplayDirection: "up" | "down" = "down";
  export let pauseOnHover = false;
  export let hoverSlowdown = 0.3;

  let wrapperRef: HTMLDivElement;
  let containerRef: HTMLDivElement;
  let observer: any;
  let rafId: number;
  let isHovering = false;

  const getTiltTransform = () => {
    if (!isTilted) return "none";
    return tiltDirection === "left"
      ? "rotateX(20deg) rotateZ(-20deg) skewX(20deg)"
      : "rotateX(20deg) rotateZ(20deg) skewX(-20deg)";
  };

  onMount(async () => {
    if (!containerRef || items.length === 0) return;

    const { gsap } = await import('gsap');
    const { default: Observer } = await import('gsap/Observer.js');
    gsap.registerPlugin(Observer);

    const divItems = gsap.utils.toArray(containerRef.children) as HTMLElement[];
    if (!divItems.length) return;

    const firstItem = divItems[0];
    const itemStyle = getComputedStyle(firstItem);
    const itemHeight = firstItem.offsetHeight;
    const itemMarginTop = parseFloat(itemStyle.marginTop) || 0;
    const totalItemHeight = itemHeight + itemMarginTop;
    const totalHeight = (itemHeight * items.length) + (itemMarginTop * (items.length - 1));

    const wrapFn = gsap.utils.wrap(-totalHeight, totalHeight);

    divItems.forEach((child, i) => {
      const y = i * totalItemHeight;
      gsap.set(child, { y });
    });

    if (!autoplay) {
      observer = Observer.create({
        target: containerRef,
        type: "wheel,touch,pointer",
        preventDefault: true,
        onPress: ({ target }) => {
          (target as HTMLElement).style.cursor = "grabbing";
        },
        onRelease: ({ target }) => {
          (target as HTMLElement).style.cursor = "grab";
        },
        onChange: ({ deltaY, isDragging, event }) => {
          const d = event.type === "wheel" ? -deltaY : deltaY;
          const distance = isDragging ? d * 5 : d * 10;
          divItems.forEach((child) => {
            gsap.to(child, {
              duration: 0.5,
              ease: "expo.out",
              y: `+=${distance}`,
              modifiers: {
                y: gsap.utils.unitize(wrapFn)
              }
            });
          });
        }
      });
    }

    if (autoplay) {
      const directionFactor = autoplayDirection === "down" ? 1 : -1;
      let speedPerFrame = autoplaySpeed * directionFactor;

      const tick = () => {
        const currentSpeed = isHovering && pauseOnHover ? 0 : speedPerFrame;

        divItems.forEach((child) => {
          gsap.set(child, {
            y: `+=${currentSpeed}`,
            modifiers: {
              y: gsap.utils.unitize(wrapFn)
            }
          });
        });
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);

      if (pauseOnHover) {
        const handleMouseEnter = () => {
          isHovering = true;
        };

        const handleMouseLeave = () => {
          isHovering = false;
        };

        divItems.forEach((item) => {
          item.addEventListener("mouseenter", handleMouseEnter);
          item.addEventListener("mouseleave", handleMouseLeave);
        });

        return () => {
          if (observer) observer.kill();
          divItems.forEach((item) => {
            item.removeEventListener("mouseenter", handleMouseEnter);
            item.removeEventListener("mouseleave", handleMouseLeave);
          });
        };
      }
    }
  });

  onDestroy(() => {
    if (observer) observer.kill();
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<style>
  .infinite-scroll-wrapper {
    position: fixed;
    top: -650px;
    max-height: var(--max-height);
  }

  .infinite-scroll-container {
    width: var(--width);
  }

  .infinite-scroll-item {
    height: var(--item-min-height);
    margin-top: var(--negative-margin);
  }

  .autoplay-only {
    pointer-events: none;
  }

  .autoplay-only .infinite-scroll-item {
    pointer-events: auto;
  }
</style>


<main>
  <div
  class="infinite-scroll-wrapper"
  bind:this={wrapperRef}
  style="--max-height: {maxHeight}; --width: {width}; --item-min-height: {itemMinHeight}px; --negative-margin: {negativeMargin};"
  transition:fade
>
  <div
    class="infinite-scroll-container"
    class:autoplay-only={autoplay}
    bind:this={containerRef}
    style="transform: {getTiltTransform()}"
  >
    {#each items as item, i}
      <div class="infinite-scroll-item">
        <slot {item} {i}>
          {item}
        </slot>
      </div>
    {/each}
  </div>
</div>

</main>
