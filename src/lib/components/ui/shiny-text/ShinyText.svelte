<script lang="ts">
  export let text: string = "";
  export let className: string = "";
  export let durationMs: number = 6400;
</script>

<span
  class="shiny-text {className}"
  style={`--shiny-duration: ${durationMs}ms;`}
>
  {text}
</span>

<style>
  .shiny-text {
    background-image: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.35),
      rgba(15, 23, 42, 0.95),
      rgba(250, 250, 250, 0.35)
    );
    background-size: 200% auto;
    background-position: 0% center;
    color: transparent;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    display: inline-block;
    animation: shine var(--shiny-duration) ease-in-out infinite;
  }

  @keyframes shine {
    0% {
      background-position: 0% center;
    }
    100% {
      background-position: 200% center;
    }
  }
</style>
