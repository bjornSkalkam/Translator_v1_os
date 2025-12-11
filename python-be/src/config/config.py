import os

PROMTE_WHISPER_URL = os.getenv("PROMTE_WHISPER")
PROMTE_4O_URL = os.getenv("PROMTE_4O")
PROMTE_API_KEY = os.getenv("PROMTE_API_KEY")

MODEL_URL_MAP = {
    "azure_speech": os.getenv("MODEL_AZURE_SPEECH_URL"),
    "gpt4o-mini": os.getenv("MODEL_AZURE_GPT4OMINI_URL"),
    "ollama_3": os.getenv("MODEL_OLLAMA_3_URL"),
    "gpt35": os.getenv("MODEL_GPT35_URL"),
    "promte_whisper": PROMTE_WHISPER_URL,
    "promte_4o": PROMTE_4O_URL,
}

AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")

STATUS_CREATED = "created"
STATUS_LANGUAGE_SET = "language_set"
STATUS_ONGOING = "ongoing"
STATUS_FINISHED = "finished"

DEFAULT_AUDIO_PATH = os.path.join(os.path.dirname(__file__), "src", "test.wav")
