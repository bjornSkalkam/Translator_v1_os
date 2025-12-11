import { VoiceInfo } from "./fetchVoices";

export interface LanguageInfo {
    code: string;          // "af-ZA" (full locale code)
    english: string;       // "Afrikaans (South Africa)"
    native: string;        // "Afrikaans (Suid‑Afrika)"
    voices: VoiceInfo[];
}

/**
 * Groups voices by their full locale code (e.g., "nl-NL", "en-GB").
 * This matches the database schema which stores full locale codes.
 */
export function groupVoicesByLocale(voices: VoiceInfo[]): LanguageInfo[] {
    const map = new Map<string, LanguageInfo>();

    voices.forEach((v) => {
        const code = v.locale;  // Use full locale code
        const entry = map.get(code) ?? {
            code,
            english: v.locale_english_name,
            native: v.locale_native_name,
            voices: [],
        };
        entry.voices.push(v);
        map.set(code, entry);
    });

    return [...map.values()].sort((a, b) =>
        a.english.localeCompare(b.english)
    );
}

/**
 * @deprecated Use groupVoicesByLocale instead for database compatibility
 */
export function groupVoicesByLang(voices: VoiceInfo[]): LanguageInfo[] {
    const map = new Map<string, LanguageInfo>();

    voices.forEach((v) => {
        const code = v.locale.split("-")[0];
        const entry = map.get(code) ?? {
            code,
            english: v.locale_english_name,
            native: v.locale_native_name,
            voices: [],
        };
        entry.voices.push(v);
        map.set(code, entry);
    });

    return [...map.values()].sort((a, b) =>
        a.english.localeCompare(b.english)
    );
}
