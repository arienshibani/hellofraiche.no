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
</script>

<Navbar
  let:hidden
  let:toggle
  style="background: rgb(253 186 140 / 70%); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); backdrop-filter: blur(13px);"
  class="bg-orange-300 px-2 sm:px-4 py-2.5 fixed w-full z-20 top-0 left-0"
>
  <NavBrand href="/">
    <div class="text-2xl text-black font-extrabold italic ml-2">
      HALLO FRESH
    </div>
  </NavBrand>
  <NavHamburger on:click={toggle} />
  <NavUl {hidden}>
    <NavLi class="text-xl text-black font-bold" href="/plans">Ukemenyer</NavLi>

    <NavLi class="text-xl text-black font-bold" href="/recipes"
      >Oppskrifter</NavLi
    >
    <NavLi class="text-xl text-black font-bold" href="/info">Info</NavLi>
  </NavUl>
</Navbar>
<br />
<br />
<br />

<slot />
<Toaster />
