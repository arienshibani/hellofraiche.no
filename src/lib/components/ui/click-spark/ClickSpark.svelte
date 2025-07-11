<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let sparkColor = "#fff";
  export let sparkSize = 10;
  export let sparkRadius = 15;
  export let sparkCount = 8;
  export let duration = 400;
  export let easing: "linear" | "ease-in" | "ease-in-out" | "ease-out" = "ease-out";
  export let extraScale = 1.0;

  let canvas: HTMLCanvasElement;
  let sparks: Array<{
    x: number;
    y: number;
    angle: number;
    startTime: number;
  }> = [];
  let startTime: number | null = null;
  let animationId: number;
  let resizeObserver: ResizeObserver;
  let resizeTimeout: ReturnType<typeof setTimeout>;

  const easeFunc = (t: number): number => {
    switch (easing) {
      case "linear":
        return t;
      case "ease-in":
        return t * t;
      case "ease-in-out":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t);
    }
  };

  const resizeCanvas = () => {
    if (!canvas || !canvas.parentElement) return;
    
    const parent = canvas.parentElement;
    const { width, height } = parent.getBoundingClientRect();
    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
  };

  const draw = (timestamp: number) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!startTime) {
      startTime = timestamp;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparks = sparks.filter((spark) => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= duration) {
        return false;
      }

      const progress = elapsed / duration;
      const eased = easeFunc(progress);

      const distance = eased * sparkRadius * extraScale;
      const lineLength = sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    animationId = requestAnimationFrame(draw);
  };

  const handleClick = (e: MouseEvent) => {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
    }));

    sparks = [...sparks, ...newSparks];
  };

  onMount(() => {
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;

    // Set up resize observer
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(parent);

    // Initial resize
    resizeCanvas();

    // Start animation loop
    animationId = requestAnimationFrame(draw);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="click-spark-container"
  on:mousedown={handleClick}
  on:pointerdown={handleClick}
>
  <canvas
    bind:this={canvas}
    class="click-spark-canvas"
  />
  <slot />
</div>

<style>
  .click-spark-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .click-spark-canvas {
    width: 100%;
    height: 100%;
    display: block;
    user-select: none;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 30;
  }
</style> 