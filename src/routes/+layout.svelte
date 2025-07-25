<script>
  import "../app.css";
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
  } from "flowbite-svelte";

  // Analytics integration
  import { dev } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit'

  import { Toaster } from 'svelte-french-toast';
  import ClickSpark from "$lib/components/ui/click-spark/ClickSpark.svelte";
  import { goto } from '$app/navigation';

  let isDark = false;

  injectAnalytics({ mode: dev ? 'development' : 'production' });


  // On mount, set dark mode based on localStorage or system preference
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      isDark = true;
      document.documentElement.classList.add('dark');
    } else if (saved === 'light') {
      isDark = false;
      document.documentElement.classList.remove('dark');
    } else {
      // No saved preference, use system
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  function toggleDark() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Handler to delay navigation for ClickSpark animation
  function delayedNav(event, href, toggle) {
    event.preventDefault();
    if (isSmallScreen() && toggle) toggle(); // Only collapse on small screens
    setTimeout(() => goto(href), 300);
  }

  function isSmallScreen() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  }

  $: sparkColor = isDark ? '#ffe066' : '#ff6b6b'; // yellowish in dark, red in light
</script>

<div class="relative min-h-screen">
  <ClickSpark
    sparkColor={sparkColor}
    sparkCount={8}
    duration={300}
    easing="ease-out"
    sparkSize={8}
    sparkRadius={20}
  >
    <Navbar
      let:hidden
      let:toggle
      style="box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); backdrop-filter: blur(13px);"
      class="px-2 bg-white-400 sm:px-4 py-2.5 fixed w-full z-20 top-0 left-0"
    >
      <NavBrand href="/">
        <div class="text-2xl  font-extrabold italic ml-2">
          HALLO FRAICHE
        </div>
      </NavBrand>
      <button
        class="ml-4 text-2xl focus:outline-none"
        aria-label="Toggle dark mode"
        on:click={toggleDark}
        style="background: none; border: none; cursor: pointer;"
      >
        {isDark ? '🌙' : '☀️'}
      </button>
      <NavHamburger on:click={toggle} />
      <NavUl {hidden}>
        <NavLi class="text-xl font-bold" href="/plans" on:click={(e) => delayedNav(e, '/plans', toggle)}>Ukemenyer</NavLi>
        <NavLi class="text-xl font-bold" href="/recipes" on:click={(e) => delayedNav(e, '/recipes', toggle)}>Oppskrifter</NavLi>
        <NavLi class="text-xl font-bold" href="/info" on:click={(e) => delayedNav(e, '/info', toggle)}>Info</NavLi>
      </NavUl>
    </Navbar>

    <slot />
    <Toaster />
  </ClickSpark>
</div>
