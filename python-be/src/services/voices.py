import functools
from babel import Locale
import azure.cognitiveservices.speech as speechsdk
from config import AZURE_SPEECH_KEY, AZURE_SPEECH_REGION


def make_speech_config() -> speechsdk.SpeechConfig:
    return speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION,
    )


@functools.lru_cache()
def list_voices() -> list[dict[str, str]]:
    cfg = make_speech_config()
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=cfg)
    result = synthesizer.get_voices_async().get()
    if result.reason != speechsdk.ResultReason.VoicesListRetrieved:
        raise RuntimeError(f"Voice list failed: {result.reason}")

    voices_info = []
    for voice in result.voices:
        try:
            babel_locale = Locale.parse(voice.locale.replace("-", "_"))
            locale_english_name = babel_locale.get_display_name("en").title()
            locale_native_name = babel_locale.get_display_name(babel_locale).title()
        except Exception as e:
            locale_english_name = voice.locale
            locale_native_name = voice.locale

        voices_info.append(
            {
                "name": voice.name,
                "short_name": voice.short_name,
                "locale": voice.locale,
                "local_name": voice.local_name,
                "locale_english_name": locale_english_name,
                "locale_native_name": locale_native_name,
                "gender": voice.gender.name,
                "voice_type": voice.voice_type.name,
            }
        )

    return voices_info
