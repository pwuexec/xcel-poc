/**
 * Format user name according to GDPR compliance rules
 * Shows only the first letter of the surname followed by a period
 * 
 * Examples:
 * - "John Doe" -> "John D."
 * - "Mary Jane Smith" -> "Mary Jane S."
 * - "Alice" -> "Alice"
 * - "" -> ""
 * 
 * @param name - Full name of the user
 * @returns GDPR-compliant formatted name
 */
export function formatUserNameGDPR(name: string | undefined): string {
    if (!name || name.trim() === "") {
        return "";
    }

    const trimmedName = name.trim();
    const parts = trimmedName.split(/\s+/); // Split by whitespace

    // If only one name part (no surname), return as is
    if (parts.length === 1) {
        return parts[0];
    }

    // Get all parts except the last one (surname)
    const firstNames = parts.slice(0, -1).join(" ");
    // Get the last part (surname) and take only first letter
    const surnameInitial = parts[parts.length - 1].charAt(0).toUpperCase();

    return `${firstNames} ${surnameInitial}.`;
}
