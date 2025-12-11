# Language configuration for supported languages
# Each language defines transcription, translation, and TTS model preferences

LANGUAGES = {
    # ── Arabic ────────────────────────────────────────────────────────────────
    "ar-EG": {
        "english_name": "Arabic",
        "native_name": "العربية",
        "region": "Egypt",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ar-EG-SalmaNeural",
    },
    "ar-JO": {
        "english_name": "Arabic",
        "native_name": "العربية",
        "region": "Jordan",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ar-JO-TaimNeural",
    },
    "ar-SY": {
        "english_name": "Arabic",
        "native_name": "العربية",
        "region": "Syria",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ar-SY-AmanyNeural",
    },
    "ar-PS": {
        "english_name": "Arabic",
        "native_name": "العربية",
        "region": "Palestinian Authority",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ar-PS-SalmaNeural",
    },
    # ── English ───────────────────────────────────────────────────────────────
    "en-GB": {
        "english_name": "English",
        "native_name": "English",
        "region": "United Kingdom",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "en-GB-LibbyNeural",
    },
    # ── French ────────────────────────────────────────────────────────────────
    "fr-FR": {
        "english_name": "French",
        "native_name": "français",
        "region": "France",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "fr-FR-DeniseNeural",
    },
    # ── Macedonian ────────────────────────────────────────────────────────────
    "mk-MK": {
        "english_name": "Macedonian",
        "native_name": "македонски",
        "region": "North Macedonia",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "mk-MK-MarijaNeural",
    },
    # ── Nepali ────────────────────────────────────────────────────────────────
    "ne-NP": {
        "english_name": "Nepali",
        "native_name": "नेपाली",
        "region": "Nepal",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ne-NP-HemkalaNeural",
    },
    # ── Persian / Farsi ───────────────────────────────────────────────────────
    "fa-IR": {
        "english_name": "Persian",
        "native_name": "فارسی",
        "region": "Iran",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "fa-IR-DilaraNeural",
    },
    # ── Russian ───────────────────────────────────────────────────────────────
    "ru-RU": {
        "english_name": "Russian",
        "native_name": "русский",
        "region": "Russia",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ru-RU-SvetlanaNeural",
    },
    # ── Somali ────────────────────────────────────────────────────────────────
    "so-SO": {
        "english_name": "Somali",
        "native_name": "Soomaali",
        "region": "Somalia",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "so-SO-UbaxNeural",
    },
    # ── Turkish ───────────────────────────────────────────────────────────────
    "tr-TR": {
        "english_name": "Turkish",
        "native_name": "Türkçe",
        "region": "Türkiye",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "tr-TR-EmelNeural",
    },
    # ── Ukrainian ─────────────────────────────────────────────────────────────
    "uk-UA": {
        "english_name": "Ukrainian",
        "native_name": "українська",
        "region": "Ukraine",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "uk-UA-PolinaNeural",
    },
    # ── Urdu (Pakistan) ───────────────────────────────────────────────────────
    "ur-PK": {
        "english_name": "Urdu",
        "native_name": "اردو",
        "region": "Pakistan",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "ur-PK-UzmaNeural",
    },
    # ── Danish (fixed target language) ───────────────────────────────────────
    "da-DK": {
        "english_name": "Danish",
        "native_name": "Dansk",
        "region": "Denmark",
        "models": {
            "transcribeModel": "azure_speech",
            "translationModel": "gpt4o-mini",
            "summaryModel": "gpt4o-mini",
        },
        "default_voice": "da-DK-ChristelNeural",
    },
}
