import type { ComponentType } from 'svelte';
import { Vegan, Leaf, WheatOff, MilkOff, Fish } from 'lucide-svelte';

export type DietaryLabelConfig = {
    key: string;
    label: string;
    icon?: ComponentType;
    color: 'green' | 'yellow' | 'blue' | 'purple' | 'orange' | 'indigo' | 'amber' | 'red' | 'pink' | 'gray';
};

export const PREDEFINED_DIETARY_LABELS: DietaryLabelConfig[] = [
    { key: 'vegan', label: 'Vegansk', icon: Vegan, color: 'green' },
    { key: 'vegetarian', label: 'Vegetarisk', icon: Leaf, color: 'yellow' },
    { key: 'glutenFree', label: 'Glutenfri', icon: WheatOff, color: 'blue' },
    { key: 'dairyFree', label: 'Melkefri', icon: MilkOff, color: 'purple' },
    { key: 'pescetarian', label: 'Pesci', icon: Fish, color: 'blue' },
];

// Helper function to get label config by label text
export const getLabelConfig = (labelText: string): DietaryLabelConfig | null => {
    return PREDEFINED_DIETARY_LABELS.find(config => config.label === labelText) || null;
};

// Helper function to get color classes for a label
export const getLabelColorClasses = (labelText: string, isSelected: boolean = true): string => {
    const config = getLabelConfig(labelText);
    if (!config) {
        // Custom label - use gray
        return isSelected 
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
    
    const colorMap = {
        green: isSelected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
        yellow: isSelected ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
        blue: isSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        purple: isSelected ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
        orange: isSelected ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
        indigo: isSelected ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
        amber: isSelected ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        red: isSelected ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
        pink: isSelected ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' : 'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
        gray: isSelected ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    };
    
    return colorMap[config.color];
};
