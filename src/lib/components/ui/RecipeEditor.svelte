<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { nanoid } from 'nanoid';
  import { Alert } from 'flowbite-svelte';
  import { Info, AlertTriangle, Lightbulb, Plus, Trash2, Edit2, X, Clock, Users, FileText, CheckCircle } from 'lucide-svelte';
  import ImageUpload from './ImageUpload.svelte';
  import { ALL_MEASUREMENT_UNITS } from '$lib/util/conversions';
  import type { Recipe, RecipeTip, IngredientWithPrice } from '$lib/types';
  import { PREDEFINED_DIETARY_LABELS, getLabelColorClasses, getLabelConfig } from '$lib/util/dietaryLabels';

  type TipWithTempId = RecipeTip & { _tempId?: string };

  export let recipe: Recipe;
  export let allIngredients: IngredientWithPrice[] = [];

  const dispatch = createEventDispatcher<{
    save: Recipe;
    cancel: void;
  }>();

  // Cache key for localStorage - use recipeId or 'new-recipe' for new recipes
  // For new recipes (no _id), always use 'new-recipe' as the key to ensure consistency across page refreshes
  const getCacheKey = () => {
    // Check if this is a new recipe (no _id means it hasn't been saved to DB yet)
    const isNewRecipe = !recipe._id;
    if (isNewRecipe) {
      return 'recipe-editor-cache-new-recipe';
    }
    // For existing recipes, use recipeId
    const recipeId = recipe.recipeId || 'new-recipe';
    return `recipe-editor-cache-${recipeId}`;
  };

  // Load cached recipe data from localStorage
  const loadCachedRecipe = (): Recipe | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(getCacheKey());
      if (cached) {
        return JSON.parse(cached) as Recipe;
      }
    } catch (e) {
      console.warn('Failed to load cached recipe:', e);
    }
    return null;
  };

  // Save recipe to localStorage cache
  const saveToCache = (recipeToCache: Recipe) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(recipeToCache));
    } catch (e) {
      console.warn('Failed to save recipe to cache:', e);
    }
  };

  // Clear cache for this recipe
  const clearCache = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(getCacheKey());
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  };

  // Debounce function for auto-save
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedSave = (recipeToCache: Recipe) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
      saveToCache(recipeToCache);
    }, 1000); // Save after 1 second of inactivity
  };

  // Try to load from cache first, otherwise use the provided recipe
  const cachedRecipe = loadCachedRecipe();
  const initialRecipe = cachedRecipe || recipe;
  let wasRestoredFromCache = !!cachedRecipe;

  // Local state for editing - ensure recipe has all required fields
  // Preserve recipeId from cache if available, otherwise generate one
  // Default utkast to true for new recipes (no _id), otherwise preserve from initial recipe
  let editedRecipe: Recipe = { 
    ...initialRecipe,
    steps: initialRecipe.steps || [],
    recipeIngredients: initialRecipe.recipeIngredients || [],
    portions: initialRecipe.portions || 1,
    // Preserve recipeId from cache, or from recipe, or generate new one
    recipeId: cachedRecipe?.recipeId || initialRecipe.recipeId || nanoid(),
    // Default to draft (utkast: true) for new recipes, otherwise preserve existing value
    utkast: initialRecipe._id ? (initialRecipe.utkast ?? false) : (cachedRecipe?.utkast ?? true),
    tips: initialRecipe.tips?.map((tip, idx) => ({
      ...tip,
      _tempId: `tip-${idx}-${tip.associatedWithStepNr}`
    })) || [],
    // Initialize dietary labels
    dietaryLabels: initialRecipe.dietaryLabels || []
  };
  let editingStepIndex: number | null = null;
  let editingTipId: string | null = null; // Use unique ID for tip editing
  let editingIngredientIndex: number | null = null;
  
  // Reactive map of step numbers to their tips for better reactivity
  $: tipsByStep = (() => {
    const map = new Map<number, TipWithTempId[]>();
    if (editedRecipe.tips && Array.isArray(editedRecipe.tips)) {
      editedRecipe.tips.forEach((tip: TipWithTempId) => {
        const stepNr = tip.associatedWithStepNr;
        if (!map.has(stepNr)) {
          map.set(stepNr, []);
        }
        map.get(stepNr)!.push(tip);
      });
    }
    return map;
  })();
  let newStepText = '';
  let newTipText = '';
  let newTipType: "caution" | "info" | "tip" = "tip";
  let newTipStepNr: number = 1;
  let showAddTipModal = false;
  let showAddIngredientModal = false;

  // Ingredient selection state
  let ingredientSearch = '';
  let showIngredientDropdown = false;
  let selectedIngredientId = '';
  let newIngredientAmount = 0;
  let newIngredientMeasurement = 'stk';

  // Dietary labels state
  let customLabelInput = '';

  // Filtered ingredients for dropdown
  $: filteredIngredients = allIngredients.filter(ing =>
    ing.name?.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Helper function to get tips for a specific step
  // Made reactive by accessing editedRecipe.tips directly
  function getTipsForStep(stepNumber: number): TipWithTempId[] {
    const tips = editedRecipe.tips;
    if (!tips || !Array.isArray(tips)) return [];
    return tips.filter((tip: TipWithTempId) => tip.associatedWithStepNr === stepNumber);
  }

  // Helper function to get tip config
  function getTipConfig(type: "caution" | "info" | "tip"): {
    icon: typeof AlertTriangle | typeof Info | typeof Lightbulb;
    color: 'yellow' | 'blue' | 'green';
    iconClass: string;
  } {
    switch(type) {
      case 'caution':
        return {
          icon: AlertTriangle,
          color: 'yellow' as const,
          iconClass: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'info':
        return {
          icon: Info,
          color: 'blue' as const,
          iconClass: 'text-blue-600 dark:text-blue-400'
        };
      case 'tip':
      default:
        return {
          icon: Lightbulb,
          color: 'green' as const,
          iconClass: 'text-green-600 dark:text-green-400'
        };
    }
  }

  // Helper function to get tip temp ID
  function getTipTempId(tip: TipWithTempId): string | undefined {
    return tip._tempId;
  }

  // Step editing functions
  function startEditStep(index: number) {
    editingStepIndex = index;
  }

  function saveStep(index: number, newText: string) {
    if (newText.trim()) {
      editedRecipe.steps[index] = newText.trim();
      editingStepIndex = null;
    }
  }

  function deleteStep(index: number) {
    editedRecipe.steps = editedRecipe.steps.filter((_, i) => i !== index);
    // Update tip step numbers if needed
    if (editedRecipe.tips) {
      editedRecipe.tips = editedRecipe.tips.map(tip => {
        if (tip.associatedWithStepNr > index + 1) {
          return { ...tip, associatedWithStepNr: tip.associatedWithStepNr - 1 };
        }
        return tip;
      }).filter(tip => tip.associatedWithStepNr <= editedRecipe.steps.length);
    }
  }

  function addStep() {
    if (newStepText.trim()) {
      editedRecipe.steps = [...editedRecipe.steps, newStepText.trim()];
      newStepText = '';
    }
  }

  function moveStepUp(index: number) {
    if (index > 0) {
      const steps = [...editedRecipe.steps];
      [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      editedRecipe.steps = steps;
      // Update tip step numbers
      if (editedRecipe.tips) {
        editedRecipe.tips = editedRecipe.tips.map(tip => {
          if (tip.associatedWithStepNr === index + 1) {
            return { ...tip, associatedWithStepNr: index };
          } else if (tip.associatedWithStepNr === index) {
            return { ...tip, associatedWithStepNr: index + 1 };
          }
          return tip;
        });
      }
    }
  }

  function moveStepDown(index: number) {
    if (index < editedRecipe.steps.length - 1) {
      const steps = [...editedRecipe.steps];
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
      editedRecipe.steps = steps;
      // Update tip step numbers
      if (editedRecipe.tips) {
        editedRecipe.tips = editedRecipe.tips.map(tip => {
          if (tip.associatedWithStepNr === index + 1) {
            return { ...tip, associatedWithStepNr: index + 2 };
          } else if (tip.associatedWithStepNr === index + 2) {
            return { ...tip, associatedWithStepNr: index + 1 };
          }
          return tip;
        });
      }
    }
  }

  // Tip editing functions
  function openAddTipModal(stepNumber: number) {
    newTipStepNr = stepNumber;
    newTipText = '';
    newTipType = 'tip';
    showAddTipModal = true;
  }

  function addTip() {
    const trimmedText = newTipText.trim();
    if (!trimmedText) {
      return; // Don't add empty tips
    }
    
    // Create new tip
    const newTip: TipWithTempId = {
      type: newTipType,
      tipText: trimmedText,
      associatedWithStepNr: newTipStepNr,
      _tempId: `tip-${Date.now()}`
    };
    
    // Update editedRecipe with new tips array to ensure reactivity
    // Ensure tips array exists and is properly typed
    const currentTips: TipWithTempId[] = Array.isArray(editedRecipe.tips) 
      ? [...editedRecipe.tips] 
      : [];
    
    // Create new tips array with the new tip
    const updatedTips = [...currentTips, newTip];
    
    // Reassign editedRecipe to trigger reactivity - include steps to force re-render
    editedRecipe = {
      ...editedRecipe,
      tips: updatedTips,
      steps: [...editedRecipe.steps] // Reassign steps array to force each block to re-render
    };
    
    // Close modal and reset form
    showAddTipModal = false;
    newTipText = '';
    newTipType = 'tip';
  }

  function deleteTip(tip: TipWithTempId) {
    if (!editedRecipe.tips || !Array.isArray(editedRecipe.tips)) return;
    
    const updatedTips = editedRecipe.tips.filter(t => (t as TipWithTempId)._tempId !== tip._tempId);
    // Create a completely new object to ensure Svelte detects the change
    editedRecipe = {
      ...editedRecipe,
      tips: updatedTips,
      steps: [...editedRecipe.steps] // Also reassign steps to force re-render
    };
  }

  function startEditTip(tip: TipWithTempId) {
    editingTipId = tip._tempId || null;
    newTipText = tip.tipText;
    newTipType = tip.type;
    newTipStepNr = tip.associatedWithStepNr;
  }

  function saveTip() {
    if (!editedRecipe.tips || !Array.isArray(editedRecipe.tips) || !editingTipId || !newTipText.trim()) {
      return;
    }
    
    const tipIndex = editedRecipe.tips.findIndex(t => (t as TipWithTempId)._tempId === editingTipId);
    if (tipIndex !== -1) {
      const updatedTips = [...editedRecipe.tips];
      updatedTips[tipIndex] = {
        type: newTipType,
        tipText: newTipText.trim(),
        associatedWithStepNr: newTipStepNr,
        _tempId: editingTipId
      } as TipWithTempId;
      
      // Reassign editedRecipe to trigger reactivity - include steps to force re-render
      editedRecipe = {
        ...editedRecipe,
        tips: updatedTips,
        steps: [...editedRecipe.steps] // Reassign steps array to force each block to re-render
      };
      
      editingTipId = null;
      newTipText = '';
    }
  }

  // Ingredient editing functions
  function openAddIngredientModal() {
    selectedIngredientId = '';
    ingredientSearch = '';
    newIngredientAmount = 0;
    newIngredientMeasurement = 'stk';
    showIngredientDropdown = false;
    showAddIngredientModal = true;
  }

  function selectIngredient(ingredient: IngredientWithPrice) {
    selectedIngredientId = ingredient._id;
    ingredientSearch = ingredient.name;
    showIngredientDropdown = false;
  }

  function addIngredient() {
    if (selectedIngredientId && newIngredientAmount > 0 && newIngredientMeasurement) {
      const ingredient = allIngredients.find(ing => ing._id === selectedIngredientId);
      if (ingredient) {
        editedRecipe.recipeIngredients = [...editedRecipe.recipeIngredients, {
          name: ingredient.name,
          amount: newIngredientAmount,
          measurement: newIngredientMeasurement
        }];
        showAddIngredientModal = false;
        selectedIngredientId = '';
        ingredientSearch = '';
        newIngredientAmount = 0;
        newIngredientMeasurement = 'stk';
      }
    }
  }

  function deleteIngredient(index: number) {
    editedRecipe.recipeIngredients = editedRecipe.recipeIngredients.filter((_, i) => i !== index);
  }

  function startEditIngredient(index: number) {
    editingIngredientIndex = index;
    const ing = editedRecipe.recipeIngredients[index];
    const dbIngredient = allIngredients.find(i => i.name === ing.name);
    if (dbIngredient) {
      selectedIngredientId = dbIngredient._id;
      ingredientSearch = dbIngredient.name;
    }
    newIngredientAmount = ing.amount;
    newIngredientMeasurement = ing.measurement;
  }

  function saveIngredient() {
    if (editingIngredientIndex !== null && selectedIngredientId && newIngredientAmount > 0) {
      const ingredient = allIngredients.find(ing => ing._id === selectedIngredientId);
      if (ingredient) {
        editedRecipe.recipeIngredients[editingIngredientIndex] = {
          name: ingredient.name,
          amount: newIngredientAmount,
          measurement: newIngredientMeasurement
        };
        editingIngredientIndex = null;
        selectedIngredientId = '';
        ingredientSearch = '';
      }
    }
  }

  function handleSave() {
    // Validate required fields
    if (!editedRecipe.title.trim()) {
      alert('Tittel er påkrevd');
      return;
    }
    if (!editedRecipe.recipeId) {
      editedRecipe.recipeId = nanoid();
    }
    if (editedRecipe.steps.length === 0) {
      alert('Minst ett steg er påkrevd');
      return;
    }
    
    // Clean up temporary IDs from tips before saving
    const cleanedRecipe: Recipe = {
      ...editedRecipe,
      tips: editedRecipe.tips?.map((tip) => {
        const { _tempId, ...cleanTip } = tip as TipWithTempId;
        return cleanTip;
      })
    };
    
    // Clear cache on successful save
    clearCache();
    
    dispatch('save', cleanedRecipe);
  }

  function handleCancel() {
    // Optionally clear cache on cancel, or keep it for recovery
    // For now, we'll keep it so users can recover their work
    dispatch('cancel');
  }

  // Auto-save to cache whenever editedRecipe changes
  $: {
    if (editedRecipe && typeof window !== 'undefined') {
      debouncedSave(editedRecipe);
    }
  }

  // Cleanup on component destroy
  onDestroy(() => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
  });

  function handleImageChange(event: CustomEvent<string | undefined>) {
    editedRecipe.recipeImage = event.detail;
  }

  // Dietary labels functions
  function toggleDietaryLabel(labelText: string) {
    if (!editedRecipe.dietaryLabels) {
      editedRecipe.dietaryLabels = [];
    }
    const index = editedRecipe.dietaryLabels.indexOf(labelText);
    if (index > -1) {
      editedRecipe.dietaryLabels = editedRecipe.dietaryLabels.filter(l => l !== labelText);
    } else {
      editedRecipe.dietaryLabels = [...editedRecipe.dietaryLabels, labelText];
    }
    // Force reactivity
    editedRecipe = { ...editedRecipe };
  }

  function addCustomLabel() {
    const trimmed = customLabelInput.trim();
    if (!trimmed) return;
    
    // Check if already exists
    if (editedRecipe.dietaryLabels?.includes(trimmed)) {
      customLabelInput = '';
      return;
    }
    
    // Check if it's a predefined label
    const predefined = PREDEFINED_DIETARY_LABELS.find(l => l.label === trimmed);
    if (predefined) {
      toggleDietaryLabel(trimmed);
      customLabelInput = '';
      return;
    }
    
    // Add custom label
    if (!editedRecipe.dietaryLabels) {
      editedRecipe.dietaryLabels = [];
    }
    editedRecipe.dietaryLabels = [...editedRecipe.dietaryLabels, trimmed];
    editedRecipe = { ...editedRecipe };
    customLabelInput = '';
  }

  function removeDietaryLabel(labelText: string) {
    if (!editedRecipe.dietaryLabels) return;
    editedRecipe.dietaryLabels = editedRecipe.dietaryLabels.filter(l => l !== labelText);
    editedRecipe = { ...editedRecipe };
  }

  function isLabelSelected(labelText: string): boolean {
    return editedRecipe.dietaryLabels?.includes(labelText) || false;
  }
</script>

<div class="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
  {#if wasRestoredFromCache}
    <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
      <div class="flex items-center gap-2">
        <Info size={16} />
        <span>Dine endringer er gjenopprettet fra cache. Du kan fortsette der du slapp.</span>
        <button
          type="button"
          class="ml-auto text-blue-600 dark:text-blue-400 hover:underline"
          on:click={() => {
            clearCache();
            wasRestoredFromCache = false;
            // Reload the original recipe
            editedRecipe = {
              ...recipe,
              steps: recipe.steps || [],
              recipeIngredients: recipe.recipeIngredients || [],
              portions: recipe.portions || 1,
              recipeId: recipe.recipeId || nanoid(),
              tips: recipe.tips?.map((tip, idx) => ({
                ...tip,
                _tempId: `tip-${idx}-${tip.associatedWithStepNr}`
              })) || []
            };
          }}
        >
          Start på nytt
        </button>
      </div>
    </div>
  {/if}
  <!-- Header Section -->
  <div class="mb-8">
    <div class="text-center mb-6">
      <input
        type="text"
        bind:value={editedRecipe.title}
        placeholder="Oppskriftstittel"
        class="text-4xl font-extrabold text-center w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 dark:text-white outline-none pb-2"
      />
      <input
        type="text"
        bind:value={editedRecipe.subtitle}
        placeholder="Undertittel (valgfritt)"
        class="text-2xl text-center w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 dark:text-gray-300 outline-none pb-2 mt-2"
      />
    </div>

    <div class="flex flex-wrap gap-6 mb-6">
      <div class="flex-1 min-w-[140px]">
        <label for="recipe-prep-time" class="flex items-center gap-2 text-sm font-medium dark:text-gray-300 mb-2">
          <Clock size={18} class="text-gray-600 dark:text-gray-400" />
          Forberedelsestid (min)
        </label>
        <div class="relative">
          <input
            id="recipe-prep-time"
            type="number"
            bind:value={editedRecipe.prepTime}
            min="0"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-500"
            placeholder="0"
          />
          <Clock size={18} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      </div>
      <div class="flex-1 min-w-[140px]">
        <label for="recipe-portions" class="flex items-center gap-2 text-sm font-medium dark:text-gray-300 mb-2">
          <Users size={18} class="text-gray-600 dark:text-gray-400" />
          Porsjoner
        </label>
        <div class="relative">
          <input
            id="recipe-portions"
            type="number"
            bind:value={editedRecipe.portions}
            min="1"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-500"
            placeholder="1"
          />
          <Users size={18} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      </div>
      <div class="flex-1 min-w-[180px]">
        <div class="flex items-center gap-2 text-sm font-medium dark:text-gray-300 mb-2">
          {#if editedRecipe.utkast}
            <FileText size={18} class="text-yellow-600 dark:text-yellow-400" />
          {:else}
            <CheckCircle size={18} class="text-green-600 dark:text-green-400" />
          {/if}
          <span>Publiseringsstatus</span>
        </div>
        <label for="recipe-utkast-toggle" class="relative inline-flex items-center cursor-pointer">
          <input
            id="recipe-utkast-toggle"
            type="checkbox"
            checked={!editedRecipe.utkast}
            on:change={(e) => editedRecipe.utkast = !e.currentTarget.checked}
            class="sr-only peer"
            aria-label="Toggle draft status"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500 dark:peer-checked:bg-green-600"></div>
          <span class="ml-3 text-sm font-medium dark:text-gray-300">
            {editedRecipe.utkast ? 'Utkast' : 'Publisert'}
          </span>
        </label>
      </div>
    </div>

    <!-- Image Upload -->
    <div class="mb-6">
      <span class="block text-sm font-medium dark:text-gray-300 mb-2">Oppskriftsbilde</span>
      <ImageUpload
        value={editedRecipe.recipeImage}
        on:change={handleImageChange}
      />
    </div>

    <!-- Dietary Labels Section -->
    <div class="mb-6">
      <div class="block text-sm font-medium dark:text-gray-300 mb-3">Kostholdsmerker</div>
      
      <!-- Predefined Labels Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {#each PREDEFINED_DIETARY_LABELS as config}
          {@const isSelected = isLabelSelected(config.label)}
          {@const Icon = config.icon}
          <label
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:scale-105 {getLabelColorClasses(config.label, isSelected)}"
          >
            <input
              type="checkbox"
              checked={isSelected}
              on:change={() => toggleDietaryLabel(config.label)}
              class="sr-only"
              aria-label={config.label}
            />
            {#if Icon}
              <Icon size={16} />
            {/if}
            <span>{config.label}</span>
          </label>
        {/each}
      </div>

      <!-- Custom Label Input -->
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={customLabelInput}
          placeholder="Legg til egendefinert merke..."
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 dark:focus:border-blue-500"
          on:keydown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomLabel();
            }
          }}
        />
        <button
          type="button"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors dark:bg-blue-900"
          on:click={addCustomLabel}
        >
          Legg til
        </button>
      </div>

      <!-- Selected Labels Display -->
      {#if editedRecipe.dietaryLabels && editedRecipe.dietaryLabels.length > 0}
        <div class="mt-4">
          <p class="text-sm font-medium dark:text-gray-300 mb-2">Valgte merker:</p>
          <div class="flex flex-wrap gap-2">
            {#each editedRecipe.dietaryLabels as label}
              {@const config = getLabelConfig(label)}
              {@const Icon = config?.icon}
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium {getLabelColorClasses(label, true)}"
              >
                {#if Icon}
                  <Icon size={16} />
                {/if}
                <span>{label}</span>
                <button
                  type="button"
                  class="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                  on:click={() => removeDietaryLabel(label)}
                  aria-label={`Fjern ${label}`}
                >
                  <X size={14} />
                </button>
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Ingredients Section -->
  <div class="mb-8">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold dark:text-white">Ingredienser</h2>
      <button
        type="button"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        on:click={openAddIngredientModal}
      >
        <Plus size={20} />
        Legg til ingrediens
      </button>
    </div>

    {#if editedRecipe.recipeIngredients.length > 0}
      <div class="border rounded-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-2 text-left dark:text-white">Ingrediens</th>
              <th class="px-4 py-2 text-right dark:text-white">Mengde</th>
              <th class="px-4 py-2 text-right dark:text-white">Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {#each editedRecipe.recipeIngredients as ingredient, index}
              {@const isEditing = editingIngredientIndex === index}
              <tr class="border-t dark:border-gray-600">
                <td class="px-4 py-2 dark:text-white relative">
                  {#if isEditing}
                    <div class="space-y-2">
                      <div class="relative">
                        <input
                          type="text"
                          bind:value={ingredientSearch}
                          placeholder="Søk ingrediens..."
                          class="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                          on:focus={() => showIngredientDropdown = true}
                        />
                        {#if showIngredientDropdown && filteredIngredients.length > 0}
                          <div class="absolute z-50 bg-white dark:bg-gray-800 border rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1">
                            {#each filteredIngredients as ing}
                              <button
                                type="button"
                                class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                                on:click={() => {
                                  selectIngredient(ing);
                                  showIngredientDropdown = false;
                                }}
                              >
                                {ing.name}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {:else}
                    {ingredient.name}
                  {/if}
                </td>
                <td class="px-4 py-2 text-right dark:text-white">
                  {#if isEditing}
                    <div class="flex gap-2 justify-end">
                      <input
                        type="number"
                        bind:value={newIngredientAmount}
                        min="0"
                        step="0.01"
                        class="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        bind:value={newIngredientMeasurement}
                        class="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                      >
                        {#each ALL_MEASUREMENT_UNITS as unit}
                          <option value={unit}>{unit}</option>
                        {/each}
                      </select>
                    </div>
                  {:else}
                    {ingredient.amount} {ingredient.measurement}
                  {/if}
                </td>
                <td class="px-4 py-2 text-right">
                  {#if isEditing}
                    <button
                      type="button"
                      class="text-green-600 hover:text-green-700 dark:text-green-400"
                      on:click={saveIngredient}
                    >
                      Lagre
                    </button>
                    <button
                      type="button"
                      class="text-gray-600 hover:text-gray-700 dark:text-gray-400 ml-2"
                      on:click={() => editingIngredientIndex = null}
                    >
                      Avbryt
                    </button>
                  {:else}
                    <button
                      type="button"
                      class="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      on:click={() => startEditIngredient(index)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-700 dark:text-red-400 ml-2"
                      on:click={() => deleteIngredient(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-gray-500 dark:text-gray-400 text-center py-4">Ingen ingredienser lagt til ennå</p>
    {/if}
  </div>

  <!-- Steps Section -->
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4 dark:text-white">Fremgangsmåte</h2>
    {#each editedRecipe.steps as step, index}
      {@const stepNumber = index + 1}
      {@const isEditing = editingStepIndex === index}
      {@const stepTips = tipsByStep.get(stepNumber) || []}
      
      <div class="mb-6 border-l-4 border-blue-500 pl-4">
        <div class="flex items-start gap-2 mb-2">
          <span class="font-bold text-xl dark:text-white">{stepNumber}.</span>
          {#if isEditing}
            <textarea
              bind:value={editedRecipe.steps[index]}
              class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 min-h-[60px]"
              on:blur={() => saveStep(index, editedRecipe.steps[index])}
              on:keydown={(e) => {
                // Stop propagation to prevent parent handlers from interfering
                e.stopPropagation();
                if (e.key === 'Escape') {
                  editingStepIndex = null;
                }
              }}
              on:keyup={(e) => e.stopPropagation()}
              on:input={(e) => e.stopPropagation()}
            />
          {:else}
            <button
              type="button"
              class="flex-1 text-left text-xl dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              on:click={() => startEditStep(index)}
            >
              {step}
            </button>
          {/if}
          <div class="flex gap-1">
            {#if !isEditing}
              <button
                type="button"
                class="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                on:click={() => startEditStep(index)}
                title="Rediger"
              >
                <Edit2 size={18} />
              </button>
            {/if}
            {#if index > 0}
              <button
                type="button"
                class="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                on:click={() => moveStepUp(index)}
                title="Flytt opp"
              >
                ↑
              </button>
            {/if}
            {#if index < editedRecipe.steps.length - 1}
              <button
                type="button"
                class="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                on:click={() => moveStepDown(index)}
                title="Flytt ned"
              >
                ↓
              </button>
            {/if}
            <button
              type="button"
              class="text-red-600 hover:text-red-700 dark:text-red-400"
              on:click={() => deleteStep(index)}
              title="Slett"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <!-- Tips for this step -->
        {#if stepTips.length > 0}
          <div class="ml-6 space-y-2 mb-2">
            {#each stepTips as tip}
              {@const tipConfig = getTipConfig(tip.type)}
              {@const IconComponent = tipConfig.icon}
              {@const tipTempId = getTipTempId(tip)}
              {#if editingTipId === tipTempId}
                <div class="border rounded p-3 bg-gray-50 dark:bg-gray-700">
                  <div class="mb-2">
                    <label for="tip-type-edit" class="block text-sm font-medium dark:text-gray-300 mb-1">Type</label>
                    <select
                      id="tip-type-edit"
                      bind:value={newTipType}
                      class="w-full px-2 py-1 border rounded dark:bg-gray-600 dark:text-white"
                    >
                      <option value="tip">Tip</option>
                      <option value="info">Info</option>
                      <option value="caution">Advarsel</option>
                    </select>
                  </div>
                  <div class="mb-2">
                    <label for="tip-text-edit" class="block text-sm font-medium dark:text-gray-300 mb-1">Tekst</label>
                    <textarea
                      id="tip-text-edit"
                      bind:value={newTipText}
                      placeholder="Tip tekst..."
                      class="w-full px-2 py-1 border rounded dark:bg-gray-600 dark:text-white min-h-[80px]"
                    />
                  </div>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      on:click={saveTip}
                    >
                      Lagre
                    </button>
                    <button
                      type="button"
                      class="text-sm bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                      on:click={() => editingTipId = null}
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              {:else}
                <Alert color={tipConfig.color} class="flex items-start gap-2">
                  <IconComponent size={20} class={tipConfig.iconClass} />
                  <span class="flex-1 text-sm">{tip.tipText}</span>
                  <button
                    type="button"
                    class="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                    on:click={() => startEditTip(tip)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-800 dark:text-red-400"
                    on:click={() => deleteTip(tip)}
                  >
                    <Trash2 size={14} />
                  </button>
                </Alert>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Add Tip Button -->
        <button
          type="button"
          class="ml-6 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          on:click={() => openAddTipModal(stepNumber)}
        >
          <Plus size={14} />
          Legg til tip
        </button>
      </div>
    {/each}

    <!-- Add Step -->
    <div class="border-l-4 border-gray-300 dark:border-gray-600 pl-4">
      <div class="flex gap-2">
        <textarea
          bind:value={newStepText}
          placeholder="Skriv inn nytt steg..."
          class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 min-h-[60px]"
          on:keydown={(e) => {
            // Stop propagation to prevent parent handlers from interfering
            e.stopPropagation();
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              addStep();
            }
          }}
          on:keyup={(e) => e.stopPropagation()}
          on:input={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          on:click={addStep}
        >
          <Plus size={20} />
          Legg til steg
        </button>
      </div>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="flex justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-600">
    <button
      type="button"
      class="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
      on:click={handleCancel}
    >
      Avbryt
    </button>
    <button
      type="button"
      class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
      on:click={handleSave}
    >
      Lagre oppskrift
    </button>
  </div>
</div>

<!-- Add Tip Modal -->
{#if showAddTipModal}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tip-modal-title"
  >
    <!-- Backdrop button for closing modal -->
    <button
      type="button"
      class="absolute inset-0 w-full h-full cursor-default"
      aria-label="Close modal"
      on:click={() => showAddTipModal = false}
      on:keydown={(e) => {
        if (e.key === 'Escape') {
          showAddTipModal = false;
        }
      }}
    ></button>
    <div 
      class="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl"
    >
      <h3 id="tip-modal-title" class="text-xl font-bold mb-4 dark:text-white">Suppler steg {newTipStepNr} med ekstra info</h3>
      <div class="space-y-4">
        <div>
          <label for="tip-type-add" class="block text-sm font-medium dark:text-gray-300 mb-1">Type</label>
          <select
            id="tip-type-add"
            bind:value={newTipType}
            class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="tip">Tip</option>
            <option value="info">Info</option>
            <option value="caution">Advarsel</option>
          </select>
        </div>
        <div>
          <label for="tip-text-add" class="block text-sm font-medium dark:text-gray-300 mb-1">Tekst</label>
          <textarea
            id="tip-text-add"
            bind:value={newTipText}
            placeholder="Skriv tip tekst..."
            class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white min-h-[100px]"
            on:keydown={(e) => e.stopPropagation()}
            on:keyup={(e) => e.stopPropagation()}
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button
          type="button"
          class="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded transition-colors"
          on:click={(e) => {
            e.stopPropagation();
            showAddTipModal = false;
            newTipText = '';
          }}
        >
          Avbryt
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          on:click={(e) => {
            e.stopPropagation();
            addTip();
          }}
        >
          Legg til
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Ingredient Modal -->
{#if showAddIngredientModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4 dark:text-white">Legg til ingrediens</h3>
      <div class="space-y-4">
        <div>
          <label for="ingredient-search-modal" class="block text-sm font-medium dark:text-gray-300 mb-1">Ingrediens</label>
          <div class="relative">
            <input
              id="ingredient-search-modal"
              type="text"
              bind:value={ingredientSearch}
              placeholder="Søk ingrediens..."
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
              on:focus={() => showIngredientDropdown = true}
            />
            {#if showIngredientDropdown && filteredIngredients.length > 0}
              <div class="absolute z-10 bg-white dark:bg-gray-800 border rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1">
                {#each filteredIngredients as ing}
                  <button
                    type="button"
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                    on:click={() => selectIngredient(ing)}
                  >
                    {ing.name}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ingredient-amount" class="block text-sm font-medium dark:text-gray-300 mb-1">Mengde</label>
            <input
              id="ingredient-amount"
              type="number"
              bind:value={newIngredientAmount}
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label for="ingredient-unit" class="block text-sm font-medium dark:text-gray-300 mb-1">Enhet</label>
            <select
              id="ingredient-unit"
              bind:value={newIngredientMeasurement}
              class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            >
              {#each ALL_MEASUREMENT_UNITS as unit}
                <option value={unit}>{unit}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button
          type="button"
          class="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded"
          on:click={() => showAddIngredientModal = false}
        >
          Avbryt
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          on:click={addIngredient}
        >
          Legg til
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.dark) {
    color-scheme: dark;
  }
</style>
