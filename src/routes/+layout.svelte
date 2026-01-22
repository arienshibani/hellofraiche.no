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
  import { onMount, onDestroy } from 'svelte';

  let isDark = false;
  let navbarToggleFn: (() => void) | undefined = undefined;
  let currentToggle: (() => void) | undefined = undefined;
  let navbarElement: HTMLElement | null = null;
  let darkModeToggleElement: HTMLElement | null = null;
  let menuHidden = true;
  let currentHidden = true;

  injectAnalytics({ mode: dev ? 'development' : 'production' });

  // Track menu state reactively
  $: menuHidden = currentHidden;

  // Handle clicks outside the menu to close it on mobile
  function handleClickOutside(event: MouseEvent) {
    if (!isSmallScreen() || !currentToggle) return;
    
    const target = event.target as HTMLElement;
    
    // Don't do anything if clicking on:
    // 1. The navbar itself
    // 2. The dark mode toggle button
    // 3. Any link (navigation) - these should never trigger menu toggle
    // 4. Any button inside a link
    if (navbarElement && navbarElement.contains(target)) return;
    if (darkModeToggleElement && darkModeToggleElement.contains(target)) return;
    
    // Check if click is on a link or button inside a link - these should navigate, never toggle menu
    const clickedLink = target.closest('a');
    const clickedButton = target.closest('button');
    
    // If clicking on a link, never toggle menu (even if menu is open, let navigation handle it)
    if (clickedLink) return;
    
    // If clicking on a button that's inside a link, also don't toggle
    if (clickedButton && clickedButton.closest('a')) return;
    
    // Only handle menu closing if menu is open
    if (menuHidden) return;
    
    // Allow buttons to work (except if it's the hamburger, which is handled separately)
    if (clickedButton && clickedButton !== navbarElement?.querySelector('[aria-label*="menu"], [aria-label*="Menu"]')) {
      return;
    }
    
    // Only close menu if clicking on non-interactive content
    currentToggle();
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  // Function to capture toggle function
  function captureToggle(toggleFn: () => void) {
    currentToggle = toggleFn;
  }


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

  function toggleDark(event?: MouseEvent) {
    // Stop event propagation to prevent triggering menu toggle
    if (event) {
      event.stopPropagation();
    }
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
    if (isSmallScreen() && toggle) {
      // Always close the menu on mobile when navigating
      toggle();
    }
    setTimeout(() => goto(href), 300);
  }

  function handleNavBrandClick(event: Event, toggle?: () => void) {
    event.preventDefault();
    if (isSmallScreen() && toggle) {
      // Close menu when clicking logo on mobile
      toggle();
    }
    setTimeout(() => goto('/'), 300);
  }

  function isSmallScreen() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  }

  function closeMenuOnMobile() {
    if (isSmallScreen() && currentToggle) {
      currentToggle();
    }
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
      items.push({ label: 'Ukemenyer', href: '/plans' });
      // If it's a specific meal plan, add the meal plan name
      if (path !== '/plans' && path.startsWith('/plans/')) {
        const mealPlanId = path.split('/plans/')[1];
        if (mealPlanId) {
          // Decode URL-encoded meal plan name (handles spaces, emojis, etc.)
          try {
            const decodedName = decodeURIComponent(mealPlanId);
            items.push({ label: decodedName });
          } catch (e) {
            // Fallback if decoding fails
            items.push({ label: mealPlanId });
          }
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
    <div 
      class="fixed w-full z-20 top-0 left-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md" 
      style="box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);"
      bind:this={navbarElement}
    >
      <Navbar
        let:hidden
        let:toggle
        class="px-2 sm:px-4 py-0.5"
      >
        {(() => { currentToggle = toggle; currentHidden = hidden; return ''; })()}
        <NavBrand href="/" on:click={(e) => { handleNavBrandClick(e, toggle); currentToggle = toggle; }}>
          <div class="flex items-center gap-2 ml-2">
            <ChefHat size={24} class="text-gray-700 dark:text-gray-300" />
            <div class="text-xl font-extrabold italic">
              HALLO FRAICHE
            </div>
          </div>
        </NavBrand>
        
        <div class="flex-1"></div>
        
        <NavHamburger on:click={() => { toggle(); currentToggle = toggle; captureToggle(toggle); }} />
        <NavUl {hidden}>
          <NavLi class="text-base font-semibold flex items-center gap-2" href="/plans" on:click={(e) => { delayedNav(e, '/plans', toggle); currentToggle = toggle; captureToggle(toggle); }}>
            <CalendarCheck size={18} />
            Ukemenyer
          </NavLi>
          <NavLi class="text-base font-semibold flex items-center gap-2" href="/recipes" on:click={(e) => { delayedNav(e, '/recipes', toggle); currentToggle = toggle; captureToggle(toggle); }}>
            <CookingPot size={18} />
            Oppskrifter
          </NavLi>
          <NavLi class="text-base font-semibold flex items-center gap-2" href="/info" on:click={(e) => { delayedNav(e, '/info', toggle); currentToggle = toggle; captureToggle(toggle); }}>
            <Info size={18} />
            Info
          </NavLi>
        </NavUl>
      </Navbar>
    </div>

    <!-- Breadcrumb row below navbar -->
    {#if breadcrumbItems.length > 0}
      <div class="fixed w-full z-10 top-10 left-0 bg-white dark:bg-gray-900 px-2 sm:px-4 pb-2 pt-4 lg:pt-8">
        <div class="flex justify-center">
          <Breadcrumb items={breadcrumbItems} onNavigate={() => { if (isSmallScreen() && currentToggle) currentToggle(); }} />
        </div>
      </div>
    {/if}

    <!-- Spacer to account for fixed navbar and breadcrumb height -->
    <div class="w-full left-0">
      <div class={breadcrumbItems.length > 0 ? 'h-24 lg:h-28' : 'h-12'}></div>
    </div>

    <slot />
    
    <!-- Dark mode toggle - fixed bottom right -->
    <button
      bind:this={darkModeToggleElement}
      class="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Toggle dark mode"
      on:click={(e) => toggleDark(e)}
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
