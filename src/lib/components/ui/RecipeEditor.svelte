<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { nanoid } from 'nanoid';
  import { Alert } from 'flowbite-svelte';
  import { Info, AlertTriangle, Lightbulb, Plus, Trash2, Edit2, X } from 'lucide-svelte';
  import ImageUpload from './ImageUpload.svelte';
  import { ALL_MEASUREMENT_UNITS } from '$lib/util/conversions';
  import type { Recipe, RecipeIngredient, RecipeTip, IngredientWithPrice } from '$lib/types';

  type TipWithTempId = RecipeTip & { _tempId?: string };

  export let recipe: Recipe;
  export let allIngredients: IngredientWithPrice[] = [];

  const dispatch = createEventDispatcher<{
    save: Recipe;
    cancel: void;
  }>();

  // Local state for editing - ensure recipe has all required fields
  let editedRecipe: Recipe = { 
    ...recipe,
    steps: recipe.steps || [],
    recipeIngredients: recipe.recipeIngredients || [],
    portions: recipe.portions || 1,
    recipeId: recipe.recipeId || nanoid(),
    tips: recipe.tips?.map((tip, idx) => ({
      ...tip,
      _tempId: `tip-${idx}-${tip.associatedWithStepNr}`
    }))
  };
  let editingStepIndex: number | null = null;
  let editingTipId: string | null = null; // Use unique ID for tip editing
  let editingIngredientIndex: number | null = null;
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

  // Filtered ingredients for dropdown
  $: filteredIngredients = allIngredients.filter(ing =>
    ing.name?.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Helper function to get tips for a specific step
  function getTipsForStep(stepNumber: number): TipWithTempId[] {
    if (!editedRecipe.tips || !Array.isArray(editedRecipe.tips)) return [];
    return editedRecipe.tips.filter(tip => tip.associatedWithStepNr === stepNumber) as TipWithTempId[];
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
    if (newTipText.trim()) {
      if (!editedRecipe.tips) {
        editedRecipe.tips = [];
      }
      editedRecipe.tips = [...editedRecipe.tips, {
        type: newTipType,
        tipText: newTipText.trim(),
        associatedWithStepNr: newTipStepNr,
        _tempId: `tip-${Date.now()}`
      } as TipWithTempId];
      showAddTipModal = false;
      newTipText = '';
    }
  }

  function deleteTip(tip: TipWithTempId) {
    if (editedRecipe.tips) {
      editedRecipe.tips = editedRecipe.tips.filter(t => (t as TipWithTempId)._tempId !== tip._tempId);
    }
  }

  function startEditTip(tip: TipWithTempId) {
    editingTipId = tip._tempId || null;
    newTipText = tip.tipText;
    newTipType = tip.type;
    newTipStepNr = tip.associatedWithStepNr;
  }

  function saveTip() {
    if (editedRecipe.tips && editingTipId && newTipText.trim()) {
      const tipIndex = editedRecipe.tips.findIndex(t => (t as any)._tempId === editingTipId);
      if (tipIndex !== -1) {
        editedRecipe.tips[tipIndex] = {
          type: newTipType,
          tipText: newTipText.trim(),
          associatedWithStepNr: newTipStepNr
        };
        editingTipId = null;
        newTipText = '';
      }
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
    
    dispatch('save', cleanedRecipe);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function handleImageChange(event: CustomEvent<string | undefined>) {
    editedRecipe.recipeImage = event.detail;
  }
</script>

<div class="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
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

    <div class="flex gap-4 justify-center mb-6">
      <div>
        <label for="recipe-prep-time" class="block text-sm font-medium dark:text-gray-300 mb-1">Forberedelsestid (min)</label>
        <input
          id="recipe-prep-time"
          type="number"
          bind:value={editedRecipe.prepTime}
          min="0"
          class="w-24 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
      </div>
      <div>
        <label for="recipe-portions" class="block text-sm font-medium dark:text-gray-300 mb-1">Porsjoner</label>
        <input
          id="recipe-portions"
          type="number"
          bind:value={editedRecipe.portions}
          min="1"
          class="w-24 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
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
      {@const stepTips = getTipsForStep(stepNumber)}
      {@const isEditing = editingStepIndex === index}
      
      <div class="mb-6 border-l-4 border-blue-500 pl-4">
        <div class="flex items-start gap-2 mb-2">
          <span class="font-bold text-xl dark:text-white">{stepNumber}.</span>
          {#if isEditing}
            <textarea
              bind:value={editedRecipe.steps[index]}
              class="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 min-h-[60px]"
              on:blur={() => saveStep(index, editedRecipe.steps[index])}
              on:keydown={(e) => {
                if (e.key === 'Escape') {
                  editingStepIndex = null;
                }
              }}
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
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              addStep();
            }
          }}
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
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <h3 class="text-xl font-bold mb-4 dark:text-white">Legg til tip for steg {newTipStepNr}</h3>
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
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button
          type="button"
          class="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded"
          on:click={() => showAddTipModal = false}
        >
          Avbryt
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          on:click={addTip}
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
