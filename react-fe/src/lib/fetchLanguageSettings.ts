import { API_URL, API_KEY } from "../config";

export interface LanguageSetting {
    id: string;
    code: string;              // e.g., "nl-NL"
    enabled: boolean;
    voice: string | null;      // e.g., "nl-NL-FennaNeural"
    transcribe_model: string | null;
    translation_model: string | null;
    summary_model: string | null;
}

export interface LanguageSettingUpdate {
    code: string;
    enabled?: boolean;
    voice?: string | null;
    transcribe_model?: string | null;
    translation_model?: string | null;
    summary_model?: string | null;
}

const headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
};

export async function fetchLanguageSettings(): Promise<LanguageSetting[]> {
    const res = await fetch(`${API_URL}/languages/`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateLanguageSetting(
    code: string,
    update: Partial<LanguageSettingUpdate>
): Promise<LanguageSetting> {
    const res = await fetch(`${API_URL}/languages/${code}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function bulkUpdateLanguageSettings(
    updates: LanguageSettingUpdate[]
): Promise<{ updated: number; languages: LanguageSetting[] }> {
    const res = await fetch(`${API_URL}/languages/bulk`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function seedLanguages(): Promise<{ created: number; total_locales: number }> {
    const res = await fetch(`${API_URL}/languages/seed`, {
        method: "POST",
        headers,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
