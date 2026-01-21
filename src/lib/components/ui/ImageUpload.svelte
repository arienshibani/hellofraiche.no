<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Upload, Image as ImageIcon } from 'lucide-svelte';

  export let value: string | undefined = undefined; // Base64 image string
  export let maxSizeMB: number = 3; // Max file size in MB before encoding

  const dispatch = createEventDispatcher<{
    change: string | undefined;
  }>();

  let fileInput: HTMLInputElement;
  let previewUrl: string | undefined = value;
  let error: string = '';
  let isDragging = false;

  // Update preview when value changes externally
  $: if (value !== previewUrl) {
    previewUrl = value;
  }

  function processFile(file: File) {
    if (!file) return;

    error = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error = 'Kun bildefiler er tillatt';
      return;
    }

    // Validate file size (before base64 encoding)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      error = `Bildet er for stort. Maks størrelse er ${maxSizeMB}MB. Nåværende størrelse: ${fileSizeMB.toFixed(2)}MB`;
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      previewUrl = base64String;
      value = base64String;
      dispatch('change', base64String);
    };
    reader.onerror = () => {
      error = 'Feil ved lesing av bilde';
    };
    reader.readAsDataURL(file);
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    processFile(file);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }

  function removeImage() {
    previewUrl = undefined;
    value = undefined;
    if (fileInput) {
      fileInput.value = '';
    }
    dispatch('change', undefined);
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="w-full">
  {#if previewUrl}
    <div class="relative inline-block">
      <img
        src={previewUrl}
        alt="Recipe preview"
        class="max-w-2xl w-full rounded-lg shadow-lg object-cover max-h-96"
      />
      <button
        type="button"
        class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors"
        on:click={removeImage}
        title="Fjern bilde"
      >
        <X size={20} />
      </button>
    </div>
  {:else}
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors {isDragging ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'}"
      on:click={triggerFileInput}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      role="button"
      tabindex="0"
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerFileInput();
        }
      }}
    >
      <ImageIcon size={48} class="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <p class="text-gray-600 dark:text-gray-400 mb-2">
        {isDragging ? 'Slipp bilde her' : 'Klikk eller dra bilde hit for å laste opp'}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-500">
        Maks størrelse: {maxSizeMB}MB (JPEG, PNG, WebP)
      </p>
    </div>
  {/if}

  <input
    bind:this={fileInput}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    class="hidden"
    on:change={handleFileSelect}
  />

  {#if error}
    <div class="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</div>
  {/if}

  {#if previewUrl}
    <button
      type="button"
      class="mt-2 flex text-sm text-blue-600 dark:text-blue-400 hover:underline"
      on:click={triggerFileInput}
    >
      Bytt bilde
    </button>
  {/if}
</div>
