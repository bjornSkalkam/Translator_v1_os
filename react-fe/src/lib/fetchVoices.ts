import { API_URL, API_KEY } from "../config";

export interface VoiceInfo {
    short_name: string;               // "af-ZA-AdriNeural"
    locale: string;                   // "af-ZA"
    local_name: string;               // "Adri"
    locale_english_name: string;      // "Afrikaans (South Africa)"
    locale_native_name: string;       // "Afrikaans (Suid‑Afrika)"
    gender: "Male" | "Female";
    voice_type: string;               // "Neural" | "OnlineNeural" | ...
    name: string;                     // full Microsoft voice name
}

export async function fetchVoices(fetcher = window.fetch): Promise<VoiceInfo[]> {
    const res = await fetcher(`${API_URL}/sessions/available-voices`, {
        headers: { "x-api-key": API_KEY },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
