<script>
  import "../app.css";
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
  } from "flowbite-svelte";
  import { Toaster } from 'svelte-french-toast';
  import ClickSpark from "$lib/components/ui/click-spark/ClickSpark.svelte";
  import Aurora from "$lib/components/ui/aurora-background/Aurora.svelte";
  import { goto } from '$app/navigation';

  let hidden = true;

  function isSmallScreen() {
    return window.matchMedia('(max-width: 640px)').matches;
  }

  // Handler to delay navigation for ClickSpark animation
  function delayedNav(event, href, toggle) {
    event.preventDefault();
    if (isSmallScreen() && toggle) toggle(); // Only collapse on small screens
    setTimeout(() => goto(href), 300);
  }
</script>

<div class="relative min-h-screen">
  <ClickSpark
    sparkColor="#ff6b6b"
    sparkCount={8}
    duration={300}
    easing="ease-out"
    sparkSize={8}
    sparkRadius={20}
  >
    <Navbar
      let:hidden
      let:toggle
      style="background: rgb(253 186 140 / 70%); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); backdrop-filter: blur(13px);"
      class="px-2 bg-slate-400 sm:px-4 py-2.5 fixed w-full z-20 top-0 left-0"
    >
      <NavBrand href="/">
        <div class="text-2xl text-black font-extrabold italic ml-2">
          HALLO FRAICHE
        </div>
      </NavBrand>
      <NavHamburger on:click={toggle} />
      <NavUl {hidden}>
        <NavLi class="text-xl text-black font-bold" href="/plans" on:click={(e) => delayedNav(e, '/plans', toggle)}>Ukemenyer</NavLi>
        <NavLi class="text-xl text-black font-bold" href="/recipes" on:click={(e) => delayedNav(e, '/recipes', toggle)}>Oppskrifter</NavLi>
        <NavLi class="text-xl text-black font-bold" href="/info" on:click={(e) => delayedNav(e, '/info', toggle)}>Info</NavLi>
      </NavUl>
    </Navbar>
    <br />
    <br />
    <br />
    <slot />
    <Toaster />
  </ClickSpark>
</div>
