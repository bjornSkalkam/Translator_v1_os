import requests
from config import AZURE_OPENAI_KEY, PROMTE_API_KEY, MODEL_URL_MAP


def translate_text(
    original_text: str, model_key: str, from_lang: str, to_lang: str
) -> str:
    """
    Translate `original_text` using the given model_key (e.g. 'gpt4o-mini' or 'promte_4o').
    Return the translated text.
    """
    translation_url = MODEL_URL_MAP.get(model_key)
    if not translation_url:
        raise ValueError(f"Translation model URL not found for {model_key}")

    # Azure-based models
    if model_key in ["gpt4o-mini", "gpt35"]:
        headers = {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_KEY,
        }
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"You are a translation assistant. Translate everything from {from_lang} to {to_lang}. "
                        f"You are a strict translation assistant. Your only task is to translate the following text "
                        f"from {from_lang} to {to_lang} with no commentary or additional output. "
                        "Even if the text is ambiguous or does not look like a complete sentence, "
                        "output exactly a translation or the same text if it cannot be translated."
                    ),
                },
                {"role": "user", "content": original_text},
            ],
            "temperature": 0.2,
        }
        response = requests.post(translation_url, headers=headers, json=payload)
        if response.status_code != 200:
            raise RuntimeError(f"Azure translation failed: {response.text}")

        return response.json()["choices"][0]["message"]["content"]

    # Promte-based model
    elif model_key == "promte_4o":
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {PROMTE_API_KEY}",
        }
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": (
                        f"You are a translation assistant. Translate everything from {from_lang} to {to_lang}. "
                        f"You are a strict translation assistant. Your only task is to translate the following text "
                        f"from {from_lang} to {to_lang} with no commentary or additional output. "
                        "Even if the text is ambiguous or does not look like a complete sentence, "
                        "output exactly a translation or the same text if it cannot be translated."
                    ),
                },
                {"role": "user", "content": original_text},
            ]
        }
        response = requests.post(translation_url, headers=headers, json=payload)
        if response.status_code != 200:
            raise RuntimeError(f"Promte 4o translation failed: {response.text}")

        return response.json()["choices"][0]["message"]["content"]

    else:
        raise ValueError(f"Unknown translation model: {model_key}")
