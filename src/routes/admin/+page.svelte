<script>
  export let form;
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  <form class="bg-white p-8 rounded shadow-md w-80" method="POST">
    <h2 class="text-2xl font-bold mb-6 text-center">Admin Login</h2>
    {#if form?.error}
      <div class="mb-4 text-red-600 text-center">{form.error}</div>
    {/if}
    <div class="mb-4">
      <label class="block mb-1 font-semibold">Brukernavn</label>
      <input class="w-full border rounded px-3 py-2" name="username" required />
    </div>
    <div class="mb-6">
      <label class="block mb-1 font-semibold">Passord</label>
      <input class="w-full border rounded px-3 py-2" type="password" name="password" required />
    </div>
    <button class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" type="submit">Logg inn</button>
  </form>
</div>
