<script lang="ts">
  import "../app.css";
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
  } from "flowbite-svelte";
  import { CalendarCheck, CookingPot, Info, Moon, Sun, ChefHat } from 'lucide-svelte';
  import { page } from '$app/stores';
  import Breadcrumb from '$lib/components/ui/Breadcrumb.svelte';

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
      document.body.classList.add('dark');
    } else if (saved === 'light') {
      isDark = false;
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    } else {
      // No saved preference, use system
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }

  function toggleDark() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Handler to delay navigation for ClickSpark animation
  function delayedNav(event: Event, href: string, toggle?: () => void) {
    event.preventDefault();
    if (isSmallScreen() && toggle) toggle(); // Only collapse on small screens
    setTimeout(() => goto(href), 300);
  }

  function isSmallScreen() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  }

  // Generate breadcrumb items based on current route
  $: breadcrumbItems = (() => {
    const path = $page.url.pathname;
    const items: Array<{ label: string; href?: string }> = [
      { label: 'Hjem', href: '/' }
    ];

    // Don't show breadcrumb on homepage
    if (path === '/') {
      return [];
    }

    // Recipes routes
    if (path.startsWith('/recipes')) {
      items.push({ label: 'Oppskrifter', href: '/recipes' });
      // If it's a specific recipe, add the recipe title
      if (path !== '/recipes' && path.startsWith('/recipes/')) {
        const recipeId = decodeURIComponent(path.split('/recipes/')[1]);
        // Only add if it's not just the base recipes page
        if (recipeId) {
          items.push({ label: recipeId });
        }
      }
    }
    // Meal plans routes
    else if (path.startsWith('/plans')) {
      items.push({ label: 'Måltidsplaner', href: '/plans' });
      // If it's a specific meal plan, add the meal plan name
      if (path !== '/plans' && path.startsWith('/plans/')) {
        const mealPlanId = path.split('/plans/')[1];
        if (mealPlanId) {
          items.push({ label: mealPlanId });
        }
      }
    }
    // Info page
    else if (path === '/info') {
      items.push({ label: 'Info' });
    }
    // Admin routes
    else if (path.startsWith('/admin')) {
      items.push({ label: 'Admin', href: '/admin' });
      if (path.startsWith('/admin/dashboard')) {
        items.push({ label: 'Dashboard', href: '/admin/dashboard' });
        if (path.startsWith('/admin/dashboard/recipes')) {
          items.push({ label: 'Oppskrifter', href: '/admin/dashboard/recipes' });
          if (path === '/admin/dashboard/recipes/new') {
            items.push({ label: 'Ny oppskrift' });
          } else if (path.startsWith('/admin/dashboard/recipes/') && path !== '/admin/dashboard/recipes') {
            const recipeId = path.split('/admin/dashboard/recipes/')[1];
            if (recipeId) {
              items.push({ label: decodeURIComponent(recipeId) });
            }
          }
        }
      }
    }
    // Login page
    else if (path === '/login') {
      items.push({ label: 'Logg inn' });
    }

    return items;
  })();

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
      style="box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); backdrop-filter: blur(13px); min-height: 2.5rem;"
      class="px-2 bg-white/80 dark:bg-gray-900/80 sm:px-4 py-0.5 fixed w-full z-20 top-0 left-0 backdrop-blur-md"
    >
      <NavBrand href="/">
        <div class="flex items-center gap-2 ml-2">
          <ChefHat size={24} class="text-gray-700 dark:text-gray-300" />
          <div class="text-xl font-extrabold italic">
            HALLO FRAICHE
          </div>
        </div>
      </NavBrand>
      
      <!-- Breadcrumb Navigation in center of navbar -->
      {#if breadcrumbItems.length > 0}
        <div class="hidden md:flex flex-1 justify-center items-center px-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      {:else}
        <div class="hidden md:flex flex-1"></div>
      {/if}
      
      <NavHamburger on:click={toggle} />
      <NavUl {hidden}>
        <NavLi class="text-base font-semibold flex items-center gap-2" href="/plans" on:click={(e) => delayedNav(e, '/plans', toggle)}>
          <CalendarCheck size={18} />
          Ukemenyer
        </NavLi>
        <NavLi class="text-base font-semibold flex items-center gap-2" href="/recipes" on:click={(e) => delayedNav(e, '/recipes', toggle)}>
          <CookingPot size={18} />
          Oppskrifter
        </NavLi>
        <NavLi class="text-base font-semibold flex items-center gap-2" href="/info" on:click={(e) => delayedNav(e, '/info', toggle)}>
          <Info size={18} />
          Info
        </NavLi>
      </NavUl>
    </Navbar>

    <!-- Mobile breadcrumb below navbar (shown on small screens) -->
    {#if breadcrumbItems.length > 0}
      <div class="md:hidden pt-16 px-4 pb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
    {/if}

    <slot />
    
    <!-- Dark mode toggle - fixed bottom right -->
    <button
      class="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Toggle dark mode"
      on:click={toggleDark}
      title={isDark ? 'Bytt til lyst modus' : 'Bytt til mørk modus'}
    >
      {#if isDark}
        <Sun size={20} class="text-yellow-500" />
      {:else}
        <Moon size={20} class="text-gray-700" />
      {/if}
    </button>
    
    <Toaster />
  </ClickSpark>
</div>
