// Validate EAN-13 barcode
// Returns true if valid, false otherwise
export function validateEAN(ean) {
    // Accept string or number
    const str = String(ean).trim();
    if (!/^[0-9]{13}$/.test(str)) return false;
    // EAN-13 check digit calculation
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(str[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(str[12], 10);
} 