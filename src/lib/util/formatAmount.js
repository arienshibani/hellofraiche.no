/**
 * Formats ingredient amounts to prevent floating point precision issues
 * @param {number} amount - The raw amount
 * @param {string} measurement - The measurement unit
 * @returns {string} - Formatted amount with measurement
 */
export function formatAmount(amount, measurement = '') {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0' + measurement;
    }

    // Round to maximum 3 decimal places to avoid floating point precision issues
    const rounded = Math.round(amount * 1000) / 1000;

    // Convert to string and remove trailing zeros after decimal point
    let formatted = rounded.toString();

    // If it's a whole number, don't show decimal places
    if (Number.isInteger(rounded)) {
        formatted = rounded.toString();
    } else {
        // Remove trailing zeros after decimal point
        formatted = formatted.replace(/\.?0+$/, '');
    }

    return formatted + measurement;
}

/**
 * Formats just the number part without measurement
 * @param {number} amount - The raw amount
 * @returns {string} - Formatted number
 */
export function formatNumber(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0';
    }

    // Round to maximum 3 decimal places
    const rounded = Math.round(amount * 1000) / 1000;

    // Convert to string and remove trailing zeros after decimal point
    let formatted = rounded.toString();

    // If it's a whole number, don't show decimal places
    if (Number.isInteger(rounded)) {
        formatted = rounded.toString();
    } else {
        // Remove trailing zeros after decimal point
        formatted = formatted.replace(/\.?0+$/, '');
    }

    return formatted;
} 