export function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}