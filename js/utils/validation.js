/**
 * Validation Utilities
 */

/**
 * Validate index number format: XX/XXX/XX/XXXX
 * Example: CS/DVB/22/0001
 */
export function validateIndexNumber(indexNumber) {
    if (!indexNumber) return false;
    
    const pattern = /^[A-Z]{2}\/[A-Z]{3}\/\d{2}\/\d{4}$/;
    return pattern.test(indexNumber.toUpperCase());
}

/**
 * Validate email format
 */
export function validateEmail(email) {
    if (!email) return false;
    
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
    if (!password) return { valid: false, message: 'Password is required' };
    
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }
    
    return { valid: true };
}

/**
 * Validate time format (HH:MM)
 */
export function validateTime(time) {
    if (!time) return false;
    
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return pattern.test(time);
}

/**
 * Parse index number into components
 */
export function parseIndexNumber(indexNumber) {
    const parts = indexNumber.toUpperCase().split('/');
    
    if (parts.length !== 4) return null;
    
    return {
        department: parts[0],
        program: parts[1],
        year: parts[2],
        studentNumber: parts[3],
        prefix: `${parts[0]}/${parts[1]}/${parts[2]}`
    };
}

/**
 * Validate managed prefixes format
 */
export function validateManagedPrefixes(prefixesText) {
    if (!prefixesText) return [];
    
    const lines = prefixesText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    const prefixes = [];
    const pattern = /^[A-Z]{2}\/[A-Z]{3}\/\d{2}$/;
    
    for (const line of lines) {
        const upper = line.toUpperCase();
        if (pattern.test(upper)) {
            prefixes.push(upper);
        }
    }
    
    return prefixes;
}
